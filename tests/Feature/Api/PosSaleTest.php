<?php

namespace Tests\Feature\Api;

use App\Enums\BusinessStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\Category;
use App\Models\InventoryStock;
use App\Models\Membership;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

class PosSaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_completes_a_server_priced_cash_sale_with_atomic_stock_and_receipt(): void
    {
        [$owner, $business, $token] = $this->tenant(Role::BusinessOwner);
        $product = $this->product($business, 2500, 10, 8);

        $sale = $this->withToken($token)->withHeader('Idempotency-Key', 'cash-sale-0001')->postJson('/api/v1/pos/sales', [
            'lines' => [[
                'productId' => $product->getKey(), 'sku' => 'CLIENT-SKU', 'name' => 'Client Name',
                'unitPrice' => 0.01, 'quantity' => 3, 'lineDiscount' => 1.50,
            ]],
            'paymentMethod' => 'CASH',
            'tendered' => 100,
        ])->assertCreated()
            ->assertHeader('Idempotency-Replayed', 'false')
            ->assertJsonPath('businessName', $business->name)
            ->assertJsonPath('lines.0.sku', $product->sku)
            ->assertJsonPath('lines.0.unitPrice', 25)
            ->assertJsonPath('subtotal', 75)
            ->assertJsonPath('discountTotal', 1.5)
            ->assertJsonPath('grandTotal', 73.5)
            ->assertJsonPath('change', 26.5)
            ->json();

        $this->assertStringStartsWith('R-', $sale['receiptNumber']);
        $this->assertDatabaseHas('sales', ['id' => $sale['id'], 'business_id' => $business->getKey(), 'cashier_user_id' => $owner->getKey(), 'grand_total_minor' => 7350]);
        $this->assertDatabaseHas('sale_lines', ['sale_id' => $sale['id'], 'product_id' => $product->getKey(), 'sku' => $product->sku, 'line_total_minor' => 7350]);
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $product->getKey(), 'quantity' => 7, 'version' => 1]);
        $this->assertDatabaseHas('inventory_movements', ['product_id' => $product->getKey(), 'reason' => 'POS_SALE', 'delta' => -3, 'quantity_before' => 10, 'quantity_after' => 7]);
        $this->assertDatabaseHas('reorder_alerts', ['product_id' => $product->getKey(), 'status' => 'OPEN', 'observed_quantity' => 7]);
        $this->assertDatabaseHas('audit_logs', ['business_id' => $business->getKey(), 'action' => 'pos.sale_completed']);
    }

    public function test_cashier_can_sell_and_read_history_but_cannot_discount(): void
    {
        [, $business, $ownerToken] = $this->tenant(Role::BusinessOwner);
        $product = $this->product($business, 1000, 5);
        [, , $cashierToken] = $this->member($business, Role::Cashier);

        $this->withToken($cashierToken)->withHeader('Idempotency-Key', 'cashier-discount-1')->postJson('/api/v1/pos/sales', [
            'lines' => [['productId' => $product->getKey(), 'quantity' => 1, 'lineDiscount' => 1]],
            'paymentMethod' => 'CASH', 'tendered' => 20,
        ])->assertForbidden()->assertJsonPath('code', 'DISCOUNT_FORBIDDEN');
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $product->getKey(), 'quantity' => 5]);

        $sale = $this->withToken($cashierToken)->withHeader('Idempotency-Key', 'cashier-sale-0001')->postJson('/api/v1/pos/sales', [
            'lines' => [['productId' => $product->getKey(), 'quantity' => 2]],
            'paymentMethod' => 'CASH', 'tendered' => 20,
        ])->assertCreated()->json();
        $this->withToken($cashierToken)->getJson('/api/v1/pos/sales')->assertOk()->assertJsonCount(1, 'items');
        $this->withToken($cashierToken)->getJson("/api/v1/pos/sales/{$sale['id']}")->assertOk()->assertJsonPath('cashierName', $sale['cashierName']);
        $this->withToken($ownerToken)->getJson('/api/v1/pos/sales')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_recorded_non_cash_payments_require_and_preserve_a_reference(): void
    {
        [, $business, $token] = $this->tenant(Role::BusinessOwner);
        $product = $this->product($business, 3000, 4);
        $payload = ['lines' => [['productId' => $product->getKey(), 'quantity' => 1]], 'paymentMethod' => 'GCASH'];

        $this->withToken($token)->withHeader('Idempotency-Key', 'gcash-missing-ref')->postJson('/api/v1/pos/sales', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('paymentReference');
        $this->withToken($token)->withHeader('Idempotency-Key', 'gcash-sale-0001')->postJson('/api/v1/pos/sales', [
            ...$payload, 'paymentReference' => 'GCASH-REF-123',
        ])->assertCreated()
            ->assertJsonPath('paymentMethod', 'GCASH')
            ->assertJsonPath('paymentReference', 'GCASH-REF-123')
            ->assertJsonPath('tendered', null)
            ->assertJsonPath('change', null);
        $this->assertDatabaseHas('sales', ['business_id' => $business->getKey(), 'payment_method' => 'GCASH', 'payment_reference' => 'GCASH-REF-123']);
    }

    public function test_insufficient_stock_rolls_back_every_line_and_sale_record(): void
    {
        [, $business, $token] = $this->tenant(Role::BusinessOwner);
        $available = $this->product($business, 1000, 5);
        $short = $this->product($business, 1500, 1);

        $this->withToken($token)->withHeader('Idempotency-Key', 'under-tender-0001')->postJson('/api/v1/pos/sales', [
            'lines' => [['productId' => $available->getKey(), 'quantity' => 1]],
            'paymentMethod' => 'CASH', 'tendered' => 1,
        ])->assertUnprocessable()->assertJsonPath('code', 'INSUFFICIENT_TENDER');
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $available->getKey(), 'quantity' => 5, 'version' => 0]);

        $this->withToken($token)->withHeader('Idempotency-Key', 'atomic-stock-0001')->postJson('/api/v1/pos/sales', [
            'lines' => [
                ['productId' => $available->getKey(), 'quantity' => 2],
                ['productId' => $short->getKey(), 'quantity' => 2],
            ],
            'paymentMethod' => 'CASH', 'tendered' => 100,
        ])->assertStatus(409)->assertJsonPath('code', 'INSUFFICIENT_STOCK');

        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $available->getKey(), 'quantity' => 5, 'version' => 0]);
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $short->getKey(), 'quantity' => 1, 'version' => 0]);
        $this->assertDatabaseCount('sales', 0);
        $this->assertDatabaseCount('inventory_movements', 0);
    }

    public function test_checkout_requires_a_valid_idempotency_key_and_unique_product_lines(): void
    {
        [, $business, $token] = $this->tenant(Role::BusinessOwner);
        $product = $this->product($business, 1000, 3);
        $payload = [
            'lines' => [
                ['productId' => $product->getKey(), 'quantity' => 1],
                ['productId' => $product->getKey(), 'quantity' => 1],
            ],
            'paymentMethod' => 'CASH', 'tendered' => 20,
        ];

        $this->withToken($token)->postJson('/api/v1/pos/sales', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('idempotencyKey');
        $this->withToken($token)->withHeader('Idempotency-Key', 'duplicate-lines-1')->postJson('/api/v1/pos/sales', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('lines.1.productId');
        $this->assertDatabaseCount('sales', 0);
    }

    public function test_idempotency_replays_one_sale_and_rejects_key_reuse_for_another_payload(): void
    {
        [, $business, $token] = $this->tenant(Role::BusinessOwner);
        $product = $this->product($business, 1200, 10);
        $payload = [
            'lines' => [['productId' => $product->getKey(), 'quantity' => 2]],
            'paymentMethod' => 'CASH', 'tendered' => 30,
        ];

        $first = $this->withToken($token)->withHeader('Idempotency-Key', 'retry-safe-0001')->postJson('/api/v1/pos/sales', $payload)
            ->assertCreated()->json();
        $this->withToken($token)->withHeader('Idempotency-Key', 'retry-safe-0001')->postJson('/api/v1/pos/sales', $payload)
            ->assertOk()->assertHeader('Idempotency-Replayed', 'true')->assertJsonPath('id', $first['id']);
        $this->withToken($token)->withHeader('Idempotency-Key', 'retry-safe-0001')->postJson('/api/v1/pos/sales', [
            ...$payload, 'lines' => [['productId' => $product->getKey(), 'quantity' => 1]],
        ])->assertStatus(409)->assertJsonPath('code', 'IDEMPOTENCY_KEY_REUSED');

        $this->assertDatabaseCount('sales', 1);
        $this->assertDatabaseCount('sale_lines', 1);
        $this->assertDatabaseCount('inventory_movements', 1);
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $product->getKey(), 'quantity' => 8, 'version' => 1]);
    }

    public function test_sales_and_idempotency_keys_are_tenant_scoped(): void
    {
        [, $businessA, $tokenA] = $this->tenant(Role::BusinessOwner, 'Store A', 'store-a');
        [, $businessB, $tokenB] = $this->tenant(Role::BusinessOwner, 'Store B', 'store-b');
        $productA = $this->product($businessA, 1000, 3);
        $productB = $this->product($businessB, 1000, 3);
        $saleA = $this->sale($tokenA, $productA, 'shared-idempotency-key');
        $saleB = $this->sale($tokenB, $productB, 'shared-idempotency-key');

        $this->assertNotSame($saleA['id'], $saleB['id']);
        $this->withToken($tokenA)->getJson("/api/v1/pos/sales/{$saleB['id']}")->assertNotFound();
        $this->withToken($tokenB)->getJson('/api/v1/pos/sales')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonMissing(['id' => $saleA['id']]);
        $this->withToken($tokenA)->withHeader('Idempotency-Key', 'foreign-product-1')->postJson('/api/v1/pos/sales', [
            'lines' => [['productId' => $productB->getKey(), 'quantity' => 1]],
            'paymentMethod' => 'CASH', 'tendered' => 10,
        ])->assertStatus(409)->assertJsonPath('code', 'PRODUCT_UNAVAILABLE');
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $productB->getKey(), 'quantity' => 2, 'version' => 1]);
    }

    public function test_pos_entitlement_and_subscription_status_are_enforced(): void
    {
        [, $business, $token] = $this->tenant(Role::BusinessOwner);
        $business->subscription->update(['status' => SubscriptionStatus::Cancelled, 'cancelled_at' => now()]);
        $this->withToken($token)->getJson('/api/v1/pos/sales')->assertForbidden()->assertJsonPath('code', 'SUBSCRIPTION_INACTIVE');

        $business->subscription->update(['status' => SubscriptionStatus::Active, 'current_period_end' => now()->addMonth(), 'cancelled_at' => null]);
        $plan = $business->subscription->plan()->with('entitlements')->firstOrFail();
        $pos = $plan->entitlements->firstWhere('key', 'pos_enabled');
        $plan->entitlements()->updateExistingPivot($pos->getKey(), ['value' => 'false']);
        $this->withToken($token)->getJson('/api/v1/pos/sales')->assertForbidden()->assertJsonPath('code', 'ENTITLEMENT_REQUIRED');
    }

    public function test_completed_sales_and_lines_are_immutable(): void
    {
        [, $business, $token] = $this->tenant(Role::BusinessOwner);
        $sale = $this->sale($token, $this->product($business, 1000, 3), 'immutable-sale-1');
        $model = Sale::query()->findOrFail($sale['id']);

        $this->expectException(LogicException::class);
        $model->update(['cashier_name' => 'Tampered']);
    }

    public function test_completed_sale_lines_are_immutable(): void
    {
        [, $business, $token] = $this->tenant(Role::BusinessOwner);
        $sale = $this->sale($token, $this->product($business, 1000, 3), 'immutable-line-1');
        $line = Sale::query()->findOrFail($sale['id'])->lines()->firstOrFail();

        $this->expectException(LogicException::class);
        $line->update(['product_name' => 'Tampered']);
    }

    /** @return array<string, mixed> */
    private function sale(string $token, Product $product, string $key): array
    {
        return $this->withToken($token)->withHeader('Idempotency-Key', $key)->postJson('/api/v1/pos/sales', [
            'lines' => [['productId' => $product->getKey(), 'quantity' => 1]],
            'paymentMethod' => 'CASH', 'tendered' => $product->price_minor / 100,
        ])->assertCreated()->json();
    }

    private function product(Business $business, int $priceMinor, int $quantity, int $threshold = 0): Product
    {
        $category = Category::query()->firstOrCreate(['business_id' => $business->getKey(), 'name' => 'POS']);
        $sequence = Product::query()->where('business_id', $business->getKey())->count() + 1;
        $product = Product::query()->create([
            'business_id' => $business->getKey(), 'category_id' => $category->getKey(),
            'sku' => "POS-$sequence", 'name' => "POS Product $sequence", 'price_minor' => $priceMinor,
            'low_stock_threshold' => $threshold, 'is_active' => true,
        ]);
        InventoryStock::query()->create(['business_id' => $business->getKey(), 'product_id' => $product->getKey(), 'quantity' => $quantity]);

        return $product;
    }

    /** @return array{User, Business, string} */
    private function tenant(Role $role, string $name = 'Pilot Store', string $slug = 'pilot-store'): array
    {
        $business = Business::query()->create(['name' => $name, 'slug' => $slug, 'status' => BusinessStatus::Active, 'approved_at' => now()]);
        $plan = SubscriptionPlan::query()->where('code', 'BASIC')->firstOrFail();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(), 'status' => SubscriptionStatus::Active,
            'starts_at' => now(), 'current_period_start' => now(), 'current_period_end' => now()->addMonth(),
        ]);

        return $this->member($business, $role);
    }

    /** @return array{User, Business, string} */
    private function member(Business $business, Role $role): array
    {
        $user = User::factory()->create();
        Membership::query()->create(['business_id' => $business->getKey(), 'user_id' => $user->getKey(), 'role' => $role]);
        $token = $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password', 'businessId' => $business->getKey()])
            ->assertOk()->json('accessToken');

        return [$user, $business->fresh('subscription.plan'), $token];
    }
}
