<?php

namespace Tests\Feature\Api;

use App\Enums\BusinessStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\Category;
use App\Models\InventoryStock;
use App\Models\Membership;
use App\Models\Order;
use App\Models\Product;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

class CustomerOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_storefront_directory_and_catalog_expose_only_ordering_enabled_tenants_and_safe_product_fields(): void
    {
        [, $business] = $this->tenant('Ordering Store', 'ordering-store');
        $product = $this->product($business, 2500, 4);
        $basic = $this->business('Basic Store', 'basic-store', 'BASIC');
        $this->product($basic, 1000, 5);

        $this->getJson('/api/v1/storefronts')->assertOk()
            ->assertJsonPath('items.0.slug', 'ordering-store')
            ->assertJsonCount(1, 'items');
        $this->getJson('/api/v1/storefronts/ordering-store')->assertOk()
            ->assertJsonPath('business.name', 'Ordering Store')
            ->assertJsonPath('business.fulfillmentMethod', 'PICKUP')
            ->assertJsonPath('products.0.id', (string) $product->getKey())
            ->assertJsonPath('products.0.price', 25)
            ->assertJsonPath('products.0.stockOnHand', 4)
            ->assertJsonMissing(['costPrice' => 0]);
        $this->getJson('/api/v1/storefronts/basic-store')->assertNotFound();
    }

    public function test_customer_places_server_priced_idempotent_order_without_reserving_stock(): void
    {
        [$customer, $business, $token] = $this->tenant();
        $product = $this->product($business, 1750, 6);
        $payload = ['items' => [[
            'productId' => $product->getKey(), 'quantity' => 2, 'unitPrice' => 0.01, 'productName' => 'Tampered',
        ]]];

        $first = $this->withToken($token)->withHeader('Idempotency-Key', 'customer-order-0001')
            ->postJson('/api/v1/customer/orders', $payload)
            ->assertCreated()->assertHeader('Idempotency-Replayed', 'false')
            ->assertJsonPath('customer.id', (string) $customer->getKey())
            ->assertJsonPath('items.0.productName', $product->name)
            ->assertJsonPath('items.0.unitPrice', 17.5)
            ->assertJsonPath('total', 35)
            ->json();
        $this->withToken($token)->withHeader('Idempotency-Key', 'customer-order-0001')
            ->postJson('/api/v1/customer/orders', $payload)
            ->assertOk()->assertHeader('Idempotency-Replayed', 'true')->assertJsonPath('id', $first['id']);

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $product->getKey(), 'quantity' => 6, 'version' => 0]);
        $this->assertDatabaseCount('inventory_movements', 0);
        $this->assertDatabaseHas('order_status_events', ['order_id' => $first['id'], 'status' => 'PENDING', 'actor_user_id' => $customer->getKey()]);
        $this->assertDatabaseHas('audit_logs', ['business_id' => $business->getKey(), 'action' => 'order.placed']);
    }

    public function test_business_confirmation_deducts_stock_once_and_pipeline_completes(): void
    {
        [, $business, $customerToken] = $this->tenant();
        $product = $this->product($business, 1000, 5, 3);
        [, , $cashierToken] = $this->member($business, Role::Cashier);
        $order = $this->place($customerToken, $product, 2, 'confirm-order-1');

        $this->withToken($cashierToken)->postJson("/api/v1/orders/{$order['id']}/transition", ['next' => 'CONFIRMED'])
            ->assertOk()->assertJsonPath('status', 'CONFIRMED')->assertJsonCount(2, 'statusHistory');
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $product->getKey(), 'quantity' => 3, 'version' => 1]);
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->getKey(), 'reason' => 'ORDER_CONFIRMED', 'delta' => -2, 'quantity_before' => 5, 'quantity_after' => 3,
        ]);
        $this->assertDatabaseHas('reorder_alerts', ['product_id' => $product->getKey(), 'status' => 'OPEN', 'observed_quantity' => 3]);

        foreach (['PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'] as $status) {
            $this->withToken($cashierToken)->postJson("/api/v1/orders/{$order['id']}/transition", ['next' => $status])
                ->assertOk()->assertJsonPath('status', $status);
        }
        $this->withToken($cashierToken)->postJson("/api/v1/orders/{$order['id']}/transition", ['next' => 'COMPLETED'])
            ->assertStatus(409)->assertJsonPath('code', 'ILLEGAL_TRANSITION');
        $this->assertDatabaseCount('inventory_movements', 1);
        $this->assertDatabaseCount('order_status_events', 5);
    }

    public function test_insufficient_confirmation_rolls_back_status_stock_events_and_audit(): void
    {
        [, $business, $customerToken] = $this->tenant();
        $available = $this->product($business, 1000, 5);
        $short = $this->product($business, 1000, 2);
        [, , $ownerToken] = $this->member($business, Role::BusinessOwner);
        $order = $this->placeMany($customerToken, [
            ['productId' => $available->getKey(), 'quantity' => 2],
            ['productId' => $short->getKey(), 'quantity' => 2],
        ], 'atomic-confirm-1');
        InventoryStock::query()->where('product_id', $short->getKey())->update(['quantity' => 1]);

        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order['id']}/transition", ['next' => 'CONFIRMED'])
            ->assertStatus(409)->assertJsonPath('code', 'INSUFFICIENT_STOCK');
        $this->assertDatabaseHas('orders', ['id' => $order['id'], 'status' => 'PENDING', 'confirmed_at' => null]);
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $available->getKey(), 'quantity' => 5, 'version' => 0]);
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $short->getKey(), 'quantity' => 1, 'version' => 0]);
        $this->assertDatabaseCount('inventory_movements', 0);
        $this->assertDatabaseCount('order_status_events', 1);
    }

    public function test_customer_history_cancel_and_ownership_are_enforced(): void
    {
        [$customer, $business, $token] = $this->tenant();
        $product = $this->product($business, 1000, 5);
        [, , $otherCustomerToken] = $this->member($business, Role::Customer);
        $order = $this->place($token, $product, 1, 'cancel-order-1');

        $this->withToken($otherCustomerToken)->getJson('/api/v1/customer/orders')->assertOk()->assertJsonCount(0, 'items');
        $this->withToken($otherCustomerToken)->getJson("/api/v1/customer/orders/{$order['id']}")->assertNotFound();
        $this->withToken($token)->postJson("/api/v1/customer/orders/{$order['id']}/cancel", ['note' => 'Changed my mind'])
            ->assertOk()->assertJsonPath('status', 'CANCELLED')->assertJsonPath('statusHistory.1.actorName', $customer->name);
        $this->withToken($token)->postJson("/api/v1/customer/orders/{$order['id']}/cancel")
            ->assertStatus(409)->assertJsonPath('code', 'CANCELLATION_NOT_ALLOWED');
        $this->assertDatabaseCount('inventory_movements', 0);
    }

    public function test_business_rejection_requires_a_reason_and_tenant_boundaries_hide_orders_and_products(): void
    {
        [, $businessA, $customerTokenA] = $this->tenant('Store A', 'store-a');
        $productA = $this->product($businessA, 1000, 3);
        [, , $ownerTokenA] = $this->member($businessA, Role::BusinessOwner);
        [, $businessB, $customerTokenB] = $this->tenant('Store B', 'store-b');
        $productB = $this->product($businessB, 1000, 3);
        [, , $ownerTokenB] = $this->member($businessB, Role::BusinessOwner);
        $orderA = $this->place($customerTokenA, $productA, 1, 'tenant-order-a');

        $this->withToken($ownerTokenB)->getJson("/api/v1/orders/{$orderA['id']}")->assertNotFound();
        $this->withToken($customerTokenB)->withHeader('Idempotency-Key', 'foreign-order-product')
            ->postJson('/api/v1/customer/orders', ['items' => [['productId' => $productA->getKey(), 'quantity' => 1]]])
            ->assertStatus(409)->assertJsonPath('code', 'PRODUCT_UNAVAILABLE');
        $this->withToken($ownerTokenA)->postJson("/api/v1/orders/{$orderA['id']}/transition", ['next' => 'REJECTED'])
            ->assertUnprocessable()->assertJsonPath('code', 'REJECTION_NOTE_REQUIRED');
        $this->withToken($ownerTokenA)->postJson("/api/v1/orders/{$orderA['id']}/transition", ['next' => 'REJECTED', 'note' => 'Unavailable'])
            ->assertOk()->assertJsonPath('status', 'REJECTED');
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $productB->getKey(), 'quantity' => 3]);
    }

    public function test_ordering_entitlement_and_roles_are_enforced_and_snapshots_are_immutable(): void
    {
        [, $business, $customerToken] = $this->tenant();
        $product = $this->product($business, 1000, 3);
        $order = $this->place($customerToken, $product, 1, 'immutable-order-line');
        [, , $cashierToken] = $this->member($business, Role::Cashier);
        $this->withToken($cashierToken)->postJson('/api/v1/customer/orders', [])->assertForbidden();

        $business->subscription->update(['status' => SubscriptionStatus::Cancelled, 'cancelled_at' => now()]);
        $this->withToken($customerToken)->getJson('/api/v1/customer/orders')
            ->assertForbidden()->assertJsonPath('code', 'SUBSCRIPTION_INACTIVE');

        $line = Order::query()->findOrFail($order['id'])->lines()->firstOrFail();
        $this->expectException(LogicException::class);
        $line->update(['product_name' => 'Tampered']);
    }

    /** @return array<string, mixed> */
    private function place(string $token, Product $product, int $quantity, string $key): array
    {
        return $this->placeMany($token, [['productId' => $product->getKey(), 'quantity' => $quantity]], $key);
    }

    /** @param array<int, array{productId:int, quantity:int}> $items */
    private function placeMany(string $token, array $items, string $key): array
    {
        return $this->withToken($token)->withHeader('Idempotency-Key', $key)
            ->postJson('/api/v1/customer/orders', ['items' => $items])->assertCreated()->json();
    }

    private function product(Business $business, int $priceMinor, int $quantity, int $threshold = 0): Product
    {
        $category = Category::query()->firstOrCreate(['business_id' => $business->getKey(), 'name' => 'Storefront']);
        $sequence = Product::query()->where('business_id', $business->getKey())->count() + 1;
        $product = Product::query()->create([
            'business_id' => $business->getKey(), 'category_id' => $category->getKey(),
            'sku' => "ORDER-$sequence", 'name' => "Order Product $sequence", 'price_minor' => $priceMinor,
            'low_stock_threshold' => $threshold, 'is_active' => true,
        ]);
        InventoryStock::query()->create(['business_id' => $business->getKey(), 'product_id' => $product->getKey(), 'quantity' => $quantity]);

        return $product;
    }

    /** @return array{User,Business,string} */
    private function tenant(string $name = 'Customer Store', string $slug = 'customer-store'): array
    {
        $business = $this->business($name, $slug, 'STANDARD');

        return $this->member($business, Role::Customer);
    }

    private function business(string $name, string $slug, string $planCode): Business
    {
        $business = Business::query()->create([
            'name' => $name, 'slug' => $slug, 'status' => BusinessStatus::Active, 'approved_at' => now(),
        ]);
        $plan = SubscriptionPlan::query()->where('code', $planCode)->firstOrFail();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(), 'status' => SubscriptionStatus::Active,
            'starts_at' => now(), 'current_period_start' => now(), 'current_period_end' => now()->addMonth(),
        ]);

        return $business->fresh('subscription.plan.entitlements');
    }

    /** @return array{User,Business,string} */
    private function member(Business $business, Role $role): array
    {
        $user = User::factory()->create();
        Membership::query()->create(['business_id' => $business->getKey(), 'user_id' => $user->getKey(), 'role' => $role]);
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password', 'businessId' => $business->getKey(),
        ])->assertOk()->json('accessToken');

        return [$user, $business->fresh('subscription.plan.entitlements'), $token];
    }
}
