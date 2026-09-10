<?php

namespace Tests\Feature\Api;

use App\Enums\BusinessStatus;
use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\InventoryMovement;
use App\Models\Membership;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsReportTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_reports_reconcile_transactions_products_customers_and_inventory(): void
    {
        CarbonImmutable::setTestNow('2026-09-10 04:00:00 UTC');
        [$business, $owner, $ownerToken, $cashier, $cashierToken, $customer] = $this->tenant('Report Store', 'report-store');
        [$otherBusiness] = $this->tenant('Hidden Store', 'hidden-store');
        $product = $this->product($business, 'Rice', 3, 5);
        $otherProduct = $this->product($otherBusiness, 'Hidden Rice', 20, 1);
        $completedAt = CarbonImmutable::parse('2026-09-09 16:30:00 UTC');
        $this->sale($business, $cashier, $product, $completedAt, 10000, 1000, 9000, 2);
        $this->completedOrder($business, $customer, $product, $completedAt, 5000, 1);
        $this->sale($otherBusiness, null, $otherProduct, $completedAt, 99000, 0, 99000, 1);
        InventoryMovement::query()->create([
            'business_id' => $business->getKey(), 'product_id' => $product->getKey(), 'actor_user_id' => $owner->getKey(),
            'delta' => 10, 'quantity_before' => 0, 'quantity_after' => 10, 'reason' => InventoryReason::Restock,
        ]);
        InventoryMovement::query()->create([
            'business_id' => $business->getKey(), 'product_id' => $product->getKey(), 'actor_user_id' => $cashier->getKey(),
            'delta' => -2, 'quantity_before' => 5, 'quantity_after' => 3, 'reason' => InventoryReason::PosSale,
        ]);

        $this->withToken($ownerToken)->getJson('/api/v1/reports/sales?bucket=day&from=2026-09-10&to=2026-09-10')
            ->assertOk()->assertJsonCount(1, 'items')->assertJsonPath('items.0.bucket', '2026-09-10')
            ->assertJsonPath('items.0.salesCount', 2)->assertJsonPath('items.0.grossTotal', 150)
            ->assertJsonPath('items.0.discountTotal', 10)->assertJsonPath('items.0.netTotal', 140)
            ->assertJsonPath('range.timezone', 'Asia/Manila');
        $this->withToken($ownerToken)->getJson('/api/v1/reports/orders?bucket=day&from=2026-09-10&to=2026-09-10')
            ->assertOk()->assertJsonPath('items.0.completed', 1)->assertJsonPath('items.0.total', 1);
        $this->withToken($ownerToken)->getJson('/api/v1/reports/inventory?from=2026-09-01&to=2026-09-10')
            ->assertOk()->assertJsonPath('items.0.status', 'LOW')->assertJsonPath('items.0.unitsSold', 2)
            ->assertJsonPath('items.0.unitsRestocked', 10)->assertJsonPath('items.0.netMovement', 8)
            ->assertJsonPath('items.0.retailValue', 300);
        $this->withToken($ownerToken)->getJson('/api/v1/reports/overview?from=2026-09-01&to=2026-09-10')
            ->assertOk()->assertJsonPath('bestSellingProducts.0.productName', 'Rice')
            ->assertJsonPath('bestSellingProducts.0.quantitySold', 3)->assertJsonPath('bestSellingProducts.0.revenue', 140)
            ->assertJsonPath('customerTrends.0.customerEmail', $customer->email)
            ->assertJsonPath('customerTrends.0.orderCount', 1)->assertJsonPath('customerTrends.0.revenue', 50);
        $this->withToken($cashierToken)->getJson('/api/v1/dashboard')
            ->assertOk()->assertJsonPath('today.total', 140)->assertJsonPath('today.count', 2)
            ->assertJsonPath('today.itemsSold', 3)->assertJsonCount(7, 'sevenDaySales')
            ->assertJsonPath('mySalesTotal', 90);
    }

    public function test_report_authorization_entitlement_and_validation_are_enforced(): void
    {
        [$business, , $ownerToken, , $cashierToken, $customer] = $this->tenant('Secure Reports', 'secure-reports');
        $customerToken = $this->login($business, $customer);

        $this->withToken($cashierToken)->getJson('/api/v1/reports/sales')->assertForbidden();
        $this->withToken($customerToken)->getJson('/api/v1/dashboard')->assertForbidden();
        $this->withToken($ownerToken)->getJson('/api/v1/reports/sales?bucket=quarter')->assertUnprocessable();
        $this->withToken($ownerToken)->getJson('/api/v1/reports/sales?from=2024-01-01&to=2026-09-10')->assertUnprocessable();

        $basic = SubscriptionPlan::query()->where('code', 'BASIC')->firstOrFail();
        $business->subscription()->update(['subscription_plan_id' => $basic->getKey()]);
        $this->withToken($ownerToken)->getJson('/api/v1/reports/sales')->assertForbidden()->assertJsonPath('code', 'ENTITLEMENT_REQUIRED');
    }

    /** @return array{Business, User, string, User, string, User} */
    private function tenant(string $name, string $slug): array
    {
        $business = Business::query()->create(['name' => $name, 'slug' => $slug, 'timezone' => 'Asia/Manila', 'status' => BusinessStatus::Active, 'approved_at' => now()]);
        $plan = SubscriptionPlan::query()->where('code', 'STANDARD')->firstOrFail();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(), 'status' => SubscriptionStatus::Active,
            'starts_at' => now(), 'current_period_start' => now(), 'current_period_end' => now()->addMonth(),
        ]);
        $owner = User::factory()->create();
        $cashier = User::factory()->create();
        $customer = User::factory()->create();
        Membership::query()->create(['business_id' => $business->getKey(), 'user_id' => $owner->getKey(), 'role' => Role::BusinessOwner]);
        Membership::query()->create(['business_id' => $business->getKey(), 'user_id' => $cashier->getKey(), 'role' => Role::Cashier]);
        Membership::query()->create(['business_id' => $business->getKey(), 'user_id' => $customer->getKey(), 'role' => Role::Customer]);

        return [$business, $owner, $this->login($business, $owner), $cashier, $this->login($business, $cashier), $customer];
    }

    private function login(Business $business, User $user): string
    {
        return $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password', 'businessId' => $business->getKey()])->assertOk()->json('accessToken');
    }

    private function product(Business $business, string $name, int $stock, int $threshold): Product
    {
        $category = $business->categories()->create(['name' => $name.' Category']);
        $product = $business->products()->create([
            'category_id' => $category->getKey(), 'sku' => strtoupper(str_replace(' ', '-', $name)).'-'.$business->getKey(),
            'name' => $name, 'price_minor' => 10000, 'cost_minor' => 6000, 'low_stock_threshold' => $threshold, 'is_active' => true,
        ]);
        $product->stock()->create(['business_id' => $business->getKey(), 'quantity' => $stock]);

        return $product;
    }

    private function sale(Business $business, ?User $cashier, Product $product, CarbonImmutable $completedAt, int $subtotal, int $discount, int $total, int $quantity): Sale
    {
        $sale = Sale::query()->create([
            'business_id' => $business->getKey(), 'cashier_user_id' => $cashier?->getKey(), 'cashier_name' => $cashier?->name ?? 'Cashier',
            'sale_number' => 'SALE-'.$business->getKey(), 'receipt_number' => 'RECEIPT-'.$business->getKey(), 'status' => 'COMPLETED',
            'subtotal_minor' => $subtotal, 'discount_total_minor' => $discount, 'tax_total_minor' => 0, 'grand_total_minor' => $total,
            'tax_rate_basis_points' => 0, 'payment_method' => PaymentMethod::Cash, 'tendered_minor' => $total, 'change_minor' => 0,
            'idempotency_key' => 'sale-'.$business->getKey(), 'request_fingerprint' => str_repeat('a', 64), 'completed_at' => $completedAt,
        ]);
        $sale->lines()->create([
            'business_id' => $business->getKey(), 'product_id' => $product->getKey(), 'sku' => $product->sku, 'product_name' => $product->name,
            'unit_price_minor' => intdiv($subtotal, $quantity), 'quantity' => $quantity, 'line_discount_minor' => $discount, 'line_total_minor' => $total,
        ]);

        return $sale;
    }

    private function completedOrder(Business $business, User $customer, Product $product, CarbonImmutable $completedAt, int $total, int $quantity): Order
    {
        $order = Order::query()->create([
            'business_id' => $business->getKey(), 'customer_user_id' => $customer->getKey(), 'customer_name' => $customer->name, 'customer_email' => $customer->email,
            'order_number' => 'ORDER-'.$business->getKey(), 'status' => OrderStatus::Completed, 'fulfillment_method' => 'PICKUP',
            'subtotal_minor' => $total, 'total_minor' => $total, 'idempotency_key' => 'order-'.$business->getKey(),
            'request_fingerprint' => str_repeat('b', 64), 'placed_at' => $completedAt, 'confirmed_at' => $completedAt, 'completed_at' => $completedAt,
        ]);
        $order->lines()->create([
            'business_id' => $business->getKey(), 'product_id' => $product->getKey(), 'sku' => $product->sku, 'product_name' => $product->name,
            'unit_price_minor' => intdiv($total, $quantity), 'quantity' => $quantity, 'line_total_minor' => $total,
        ]);

        return $order;
    }
}
