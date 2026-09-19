<?php

namespace Tests\Feature\Api;

use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\Membership;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_load_with_safe_defaults_and_owner_updates_are_tenant_scoped(): void
    {
        [$owner, $businessA, $tokenA] = $this->owner('kevins-eleven');
        [, $businessB, $tokenB] = $this->owner('other-store');

        $this->withToken($tokenA)->getJson('/api/v1/settings')->assertOk()
            ->assertJsonPath('storeName', 'Kevins Eleven')
            ->assertJsonPath('taxRate', 0)
            ->assertJsonPath('currencySymbol', '₱')
            ->assertJsonPath('lowStockDefault', 0);

        $this->withToken($tokenA)->putJson('/api/v1/settings', [
            'storeName' => 'Kevins Eleven', 'address' => '', 'phone' => '', 'email' => '',
            'taxRate' => 0, 'currencySymbol' => '₱', 'receiptHeader' => '',
            'receiptFooter' => 'Thank you for shopping!', 'lowStockDefault' => 0,
        ])->assertOk()->assertJsonPath('address', '')->assertJsonPath('receiptHeader', '');

        $this->withToken($tokenA)->putJson('/api/v1/settings', [
            'storeName' => 'Kevins Eleven Updated',
            'address' => '123 Main Street',
            'phone' => '09171234567',
            'email' => 'store@example.com',
            'taxRate' => 7.5,
            'currencySymbol' => '₱',
            'receiptHeader' => 'Welcome to Kevins Eleven',
            'receiptFooter' => 'Come back soon',
            'lowStockDefault' => 5,
        ])->assertOk()->assertJsonPath('taxRate', 7.5)->assertJsonPath('storeName', 'Kevins Eleven Updated');

        $this->assertDatabaseHas('business_settings', [
            'business_id' => $businessA->getKey(), 'tax_rate_basis_points' => 750, 'low_stock_default' => 5,
        ]);
        $this->assertDatabaseHas('businesses', ['id' => $businessA->getKey(), 'name' => 'Kevins Eleven Updated']);
        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $businessA->getKey(), 'actor_user_id' => $owner->getKey(), 'action' => 'business.settings_updated',
        ]);
        $this->withToken($tokenB)->getJson('/api/v1/settings')->assertOk()
            ->assertJsonPath('storeName', 'Other Store')
            ->assertJsonPath('taxRate', 0);
        $this->assertDatabaseMissing('business_settings', ['business_id' => $businessB->getKey()]);
    }

    public function test_only_owner_can_edit_and_invalid_values_do_not_change_settings(): void
    {
        [, $business, $ownerToken] = $this->owner('owner-store');
        $staffToken = $this->member($business, Role::Staff);
        $cashierToken = $this->member($business, Role::Cashier);

        $this->withToken($staffToken)->getJson('/api/v1/settings')->assertOk();
        $this->withToken($cashierToken)->getJson('/api/v1/settings')->assertOk();
        $this->withToken($staffToken)->putJson('/api/v1/settings', ['storeName' => 'Hijacked'])->assertForbidden();
        $this->withToken($cashierToken)->putJson('/api/v1/settings', ['taxRate' => 5])->assertForbidden();
        $this->withToken($ownerToken)->putJson('/api/v1/settings', ['taxRate' => 101, 'currencySymbol' => '$'])
            ->assertUnprocessable()->assertJsonValidationErrors(['taxRate', 'currencySymbol']);
        $this->assertDatabaseHas('businesses', ['id' => $business->getKey(), 'name' => 'Owner Store']);
        $this->assertDatabaseMissing('business_settings', ['business_id' => $business->getKey()]);
    }

    public function test_new_products_use_threshold_default_and_pos_sales_snapshot_tax_and_receipt_text(): void
    {
        [, $business, $token] = $this->owner('kevin-store');
        $this->withToken($token)->putJson('/api/v1/settings', [
            'taxRate' => 10, 'lowStockDefault' => 4,
            'receiptHeader' => 'Kevin Store Receipt', 'receiptFooter' => 'Thank you, Kevin',
        ])->assertOk();
        $category = $this->withToken($token)->postJson('/api/v1/categories', ['name' => 'Goods'])
            ->assertCreated()->json('id');
        $product = $this->withToken($token)->postJson('/api/v1/products', [
            'sku' => 'SETTINGS-1', 'name' => 'Settings Product', 'categoryId' => $category,
            'price' => 100, 'stockOnHand' => 2,
        ])->assertCreated()->assertJsonPath('lowStockThreshold', 4)->json();
        $this->withToken($token)->withHeader('Idempotency-Key', 'settings-underpaid-1')
            ->postJson('/api/v1/pos/sales', [
                'lines' => [['productId' => $product['id'], 'quantity' => 1]],
                'paymentMethod' => 'CASH', 'tendered' => 100,
            ])->assertUnprocessable()->assertJsonPath('code', 'INSUFFICIENT_TENDER');
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $product['id'], 'quantity' => 2]);
        $sale = $this->withToken($token)->withHeader('Idempotency-Key', 'settings-sale-0001')
            ->postJson('/api/v1/pos/sales', [
                'lines' => [['productId' => $product['id'], 'quantity' => 1]],
                'paymentMethod' => 'CASH', 'tendered' => 110,
            ])->assertCreated()
            ->assertJsonPath('taxRate', 10)
            ->assertJsonPath('taxTotal', 10)
            ->assertJsonPath('grandTotal', 110)
            ->assertJsonPath('receiptHeader', 'Kevin Store Receipt')
            ->assertJsonPath('receiptFooter', 'Thank you, Kevin')->json();

        $this->withToken($token)->putJson('/api/v1/settings', [
            'taxRate' => 0, 'receiptFooter' => 'New footer', 'storeName' => 'Renamed Store',
        ])->assertOk();
        $this->withToken($token)->getJson("/api/v1/pos/sales/{$sale['id']}")->assertOk()
            ->assertJsonPath('businessName', 'Kevin Store')
            ->assertJsonPath('taxRate', 10)
            ->assertJsonPath('receiptFooter', 'Thank you, Kevin');
        $this->assertDatabaseHas('sales', ['id' => $sale['id'], 'business_id' => $business->getKey(), 'tax_total_minor' => 1000]);
    }

    /** @return array{User, Business, string} */
    private function owner(string $slug): array
    {
        $business = Business::create(['name' => str($slug)->headline()->toString(), 'slug' => $slug, 'approved_at' => now()]);
        $plan = SubscriptionPlan::query()->where('code', 'BASIC')->firstOrFail();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(), 'status' => SubscriptionStatus::Active,
            'starts_at' => now(), 'current_period_start' => now(), 'current_period_end' => now()->addMonth(),
        ]);
        $user = User::factory()->create();
        Membership::create(['business_id' => $business->getKey(), 'user_id' => $user->getKey(), 'role' => Role::BusinessOwner]);
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password', 'businessId' => $business->getKey(),
        ])->assertOk()->json('accessToken');

        return [$user, $business, $token];
    }

    private function member(Business $business, Role $role): string
    {
        $user = User::factory()->create();
        Membership::create(['business_id' => $business->getKey(), 'user_id' => $user->getKey(), 'role' => $role]);

        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password', 'businessId' => $business->getKey(),
        ])->assertOk()->json('accessToken');
    }
}
