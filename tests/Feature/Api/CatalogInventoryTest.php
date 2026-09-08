<?php

namespace Tests\Feature\Api;

use App\Enums\BusinessStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\InventoryMovement;
use App\Models\Membership;
use App\Models\Product;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use LogicException;
use Tests\TestCase;

class CatalogInventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_catalog_records_with_initial_stock_and_alerts(): void
    {
        [$owner, $business, $token] = $this->tenant(Role::BusinessOwner);
        $category = $this->withToken($token)->postJson('/api/v1/categories', ['name' => 'Pantry'])
            ->assertCreated()->json();
        $product = $this->withToken($token)->postJson('/api/v1/products', [
            'sku' => 'rice-001', 'barcode' => '480000000001', 'name' => 'Rice 1kg',
            'categoryId' => $category['id'], 'price' => 68.5, 'costPrice' => 56,
            'stockOnHand' => 3, 'lowStockThreshold' => 5,
        ])->assertCreated()->assertJsonPath('sku', 'RICE-001')->assertJsonPath('stockOnHand', 3)->json();

        $this->assertDatabaseHas('products', ['id' => $product['id'], 'business_id' => $business->getKey(), 'price_minor' => 6850]);
        $this->assertDatabaseHas('inventory_movements', ['product_id' => $product['id'], 'actor_user_id' => $owner->getKey(), 'delta' => 3, 'quantity_before' => 0, 'quantity_after' => 3]);
        $this->assertDatabaseHas('reorder_alerts', ['product_id' => $product['id'], 'status' => 'OPEN', 'observed_quantity' => 3]);
        $this->assertDatabaseHas('audit_logs', ['business_id' => $business->getKey(), 'action' => 'product.created']);
        $this->withToken($token)->getJson('/api/v1/inventory/low-stock')->assertOk()->assertJsonCount(1, 'items');
    }

    public function test_tenant_boundaries_and_per_business_identifiers_are_enforced(): void
    {
        [, $businessA, $tokenA] = $this->tenant(Role::BusinessOwner, 'Store A', 'store-a');
        [, $businessB, $tokenB] = $this->tenant(Role::BusinessOwner, 'Store B', 'store-b');
        $categoryA = $this->createCategory($tokenA, 'Goods');
        $categoryB = $this->createCategory($tokenB, 'Goods');
        $productA = $this->createProduct($tokenA, $categoryA, ['sku' => 'SHARED', 'barcode' => '111']);
        $this->createProduct($tokenB, $categoryB, ['sku' => 'SHARED', 'barcode' => '111']);

        $this->withToken($tokenB)->getJson("/api/v1/products/{$productA['id']}")->assertNotFound();
        $this->withToken($tokenB)->putJson("/api/v1/products/{$productA['id']}", ['name' => 'Stolen'])->assertNotFound();
        $this->withToken($tokenA)->postJson('/api/v1/products', $this->productPayload($categoryA, ['sku' => 'shared', 'barcode' => '222']))
            ->assertUnprocessable()->assertJsonValidationErrors('sku');
        $this->withToken($tokenA)->postJson('/api/v1/products', $this->productPayload($categoryA, ['sku' => 'OTHER', 'barcode' => '111']))
            ->assertUnprocessable()->assertJsonValidationErrors('barcode');
        $this->assertSame(1, Product::query()->where('business_id', $businessA->getKey())->count());
        $this->assertSame(1, Product::query()->where('business_id', $businessB->getKey())->count());
    }

    public function test_category_names_are_case_insensitively_unique_and_in_use_categories_are_protected(): void
    {
        [, , $token] = $this->tenant(Role::BusinessOwner);
        $category = $this->createCategory($token, 'Beverages');
        $this->withToken($token)->postJson('/api/v1/categories', ['name' => 'beverages'])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->withToken($token)->putJson("/api/v1/categories/$category", ['name' => 'Cold Drinks'])
            ->assertOk()->assertJsonPath('name', 'Cold Drinks');
        $this->createProduct($token, $category);
        $this->withToken($token)->deleteJson("/api/v1/categories/$category")
            ->assertStatus(409)->assertJsonPath('code', 'CATEGORY_IN_USE');
    }

    public function test_staff_can_mutate_inventory_while_cashiers_are_read_only(): void
    {
        [$owner, $business, $ownerToken] = $this->tenant(Role::BusinessOwner);
        $category = $this->createCategory($ownerToken, 'Drinks');
        $product = $this->createProduct($ownerToken, $category);
        [, , $staffToken] = $this->member($business, Role::Staff);
        [, , $cashierToken] = $this->member($business, Role::Cashier);

        $this->withToken($staffToken)->postJson('/api/v1/inventory/adjust', [
            'productId' => $product['id'], 'delta' => 2, 'reasonCode' => 'ADJUSTMENT', 'note' => 'Count correction',
        ])->assertOk()->assertJsonPath('product.stockOnHand', 2);
        $this->withToken($cashierToken)->getJson('/api/v1/inventory')->assertOk();
        $this->withToken($cashierToken)->postJson('/api/v1/inventory/adjust', [
            'productId' => $product['id'], 'delta' => 1, 'reasonCode' => 'ADJUSTMENT', 'note' => 'Not allowed',
        ])->assertForbidden();
        $this->withToken($cashierToken)->postJson('/api/v1/categories', ['name' => 'Nope'])->assertForbidden();
        $this->assertDatabaseHas('memberships', ['business_id' => $business->getKey(), 'user_id' => $owner->getKey()]);
    }

    public function test_adjustments_are_transactional_non_negative_and_drive_alert_state(): void
    {
        [, , $token] = $this->tenant(Role::BusinessOwner);
        $category = $this->createCategory($token, 'Frozen');
        $product = $this->createProduct($token, $category, ['stockOnHand' => 5, 'lowStockThreshold' => 2]);

        $this->withToken($token)->postJson('/api/v1/inventory/adjust', [
            'productId' => $product['id'], 'delta' => -6, 'reasonCode' => 'ADJUSTMENT', 'note' => 'Invalid count',
        ])->assertStatus(409)->assertJsonPath('code', 'NEGATIVE_STOCK');
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $product['id'], 'quantity' => 5]);

        $this->withToken($token)->postJson('/api/v1/inventory/adjust', [
            'productId' => $product['id'], 'delta' => -4, 'reasonCode' => 'ADJUSTMENT', 'note' => 'Damaged units',
        ])->assertOk()->assertJsonPath('movement.quantityBefore', 5)->assertJsonPath('movement.quantityAfter', 1);
        $this->assertDatabaseHas('reorder_alerts', ['product_id' => $product['id'], 'status' => 'OPEN']);
        $this->withToken($token)->postJson('/api/v1/inventory/restock', ['entries' => [[
            'productId' => $product['id'], 'quantity' => 10, 'supplierRef' => 'PO-42', 'note' => 'Morning delivery',
        ]]])->assertOk()->assertJsonPath('movements.0.reason', 'RESTOCK')->assertJsonPath('movements.0.quantityAfter', 11);
        $this->assertDatabaseHas('reorder_alerts', ['product_id' => $product['id'], 'status' => 'RESOLVED']);
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $product['id'], 'quantity' => 11, 'version' => 3]);
    }

    public function test_restock_batch_is_atomic_and_movement_history_is_immutable(): void
    {
        [, , $token] = $this->tenant(Role::BusinessOwner);
        $category = $this->createCategory($token, 'Snacks');
        $first = $this->createProduct($token, $category);
        $second = $this->createProduct($token, $category, ['sku' => 'SKU-2', 'barcode' => 'BAR-2']);

        $this->withToken($token)->postJson('/api/v1/inventory/restock', ['entries' => [
            ['productId' => $first['id'], 'quantity' => 4],
            ['productId' => 999999, 'quantity' => 2],
        ]])->assertUnprocessable();
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $first['id'], 'quantity' => 0]);

        $this->withToken($token)->postJson('/api/v1/inventory/restock', ['entries' => [
            ['productId' => $first['id'], 'quantity' => 4], ['productId' => $second['id'], 'quantity' => 6],
        ]])->assertOk()->assertJsonCount(2, 'movements');
        $movement = InventoryMovement::query()->where('product_id', $first['id'])->firstOrFail();
        $this->expectException(LogicException::class);
        $movement->update(['note' => 'Tampered']);
    }

    public function test_product_images_are_validated_stored_and_tenant_scoped(): void
    {
        Storage::fake('public');
        [, $businessA, $tokenA] = $this->tenant(Role::BusinessOwner, 'Store A', 'store-a');
        [, , $tokenB] = $this->tenant(Role::BusinessOwner, 'Store B', 'store-b');
        $category = $this->createCategory($tokenA, 'Fresh');
        $product = $this->createProduct($tokenA, $category);

        $response = $this->withToken($tokenA)->post("/api/v1/products/{$product['id']}/image", [
            'image' => UploadedFile::fake()->image('product.png', 120, 120),
        ], ['Accept' => 'application/json'])->assertOk();
        $path = Product::query()->findOrFail($product['id'])->primaryImage()->value('path');
        Storage::disk('public')->assertExists($path);
        $this->assertStringContainsString("product-images/{$businessA->getKey()}/", $path);
        $this->withToken($tokenA)->post("/api/v1/products/{$product['id']}/image", [
            'image' => UploadedFile::fake()->image('replacement.webp', 120, 120),
        ], ['Accept' => 'application/json'])->assertOk();
        Storage::disk('public')->assertMissing($path);
        $replacementPath = Product::query()->findOrFail($product['id'])->primaryImage()->value('path');
        Storage::disk('public')->assertExists($replacementPath);

        $this->withToken($tokenB)->post("/api/v1/products/{$product['id']}/image", [
            'image' => UploadedFile::fake()->image('other.png'),
        ], ['Accept' => 'application/json'])->assertNotFound();
        $this->withToken($tokenA)->post("/api/v1/products/{$product['id']}/image", [
            'image' => UploadedFile::fake()->create('malware.exe', 20, 'application/octet-stream'),
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->assertNotNull($response->json('imageUrl'));
    }

    public function test_entitlements_and_subscription_status_gate_catalog_access(): void
    {
        [, $business, $token] = $this->tenant(Role::BusinessOwner);
        $business->subscription->update(['status' => SubscriptionStatus::Cancelled, 'cancelled_at' => now()]);
        $this->withToken($token)->getJson('/api/v1/products')->assertForbidden()->assertJsonPath('code', 'SUBSCRIPTION_INACTIVE');

        $business->subscription->update(['status' => SubscriptionStatus::Active, 'current_period_end' => now()->addMonth(), 'cancelled_at' => null]);
        $plan = $business->subscription->plan()->with('entitlements')->firstOrFail();
        $catalog = $plan->entitlements->firstWhere('key', 'catalog_enabled');
        $plan->entitlements()->updateExistingPivot($catalog->getKey(), ['value' => 'false']);
        $this->withToken($token)->getJson('/api/v1/products')->assertForbidden()->assertJsonPath('code', 'ENTITLEMENT_REQUIRED');
    }

    private function createCategory(string $token, string $name): string
    {
        return $this->withToken($token)->postJson('/api/v1/categories', ['name' => $name])->assertCreated()->json('id');
    }

    /** @param array<string, mixed> $overrides @return array<string, mixed> */
    private function createProduct(string $token, string $categoryId, array $overrides = []): array
    {
        return $this->withToken($token)->postJson('/api/v1/products', $this->productPayload($categoryId, $overrides))->assertCreated()->json();
    }

    /** @param array<string, mixed> $overrides @return array<string, mixed> */
    private function productPayload(string $categoryId, array $overrides = []): array
    {
        return [...[
            'sku' => 'SKU-1', 'barcode' => 'BAR-1', 'name' => 'Sample Product', 'categoryId' => $categoryId,
            'price' => 25, 'stockOnHand' => 0, 'lowStockThreshold' => 2,
        ], ...$overrides];
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
