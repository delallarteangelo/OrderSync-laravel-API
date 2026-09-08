<?php

namespace Database\Seeders;

use App\Enums\ReorderAlertStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Membership;
use App\Models\Product;
use App\Models\ReorderAlert;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('Development identities are never seeded in production.');

            return;
        }

        $password = env('ORDERSYNC_DEV_SEED_PASSWORD');
        if (! is_string($password) || mb_strlen($password) < 12) {
            $this->command?->warn('Set ORDERSYNC_DEV_SEED_PASSWORD to at least 12 characters to seed local Phase 4 development fixtures.');

            return;
        }

        $business = Business::query()->firstOrCreate(
            ['slug' => 'tonettes-minimart'],
            ['name' => "Tonette's Minimart", 'timezone' => 'Asia/Manila'],
        );

        $plan = SubscriptionPlan::query()->where('code', 'BASIC')->firstOrFail();
        $now = now();
        $business->subscription()->firstOrCreate(
            ['business_id' => $business->getKey()],
            [
                'subscription_plan_id' => $plan->getKey(),
                'status' => SubscriptionStatus::Active,
                'starts_at' => $now,
                'current_period_start' => $now,
                'current_period_end' => $now->copy()->addMonthNoOverflow(),
            ],
        );

        $this->seedMember($business, 'owner@ordersync.local', 'Local Business Owner', Role::BusinessOwner, $password);
        $this->seedMember($business, 'staff@ordersync.local', 'Local Inventory Staff', Role::Staff, $password);
        $this->seedMember($business, 'cashier@ordersync.local', 'Local Cashier', Role::Cashier, $password);
        $this->seedMember($business, 'customer@ordersync.local', 'Local Customer', Role::Customer, $password);

        User::query()->updateOrCreate(
            ['email' => 'superadmin@ordersync.local'],
            [
                'name' => 'Local Super Admin',
                'password' => $password,
                'is_active' => true,
                'platform_role' => Role::SuperAdmin,
            ],
        );

        $this->seedCatalog($business, User::query()->where('email', 'owner@ordersync.local')->firstOrFail());

        $this->command?->info('Seeded local-only Phase 4 identities and catalog for OrderSync.');
    }

    private function seedMember(
        Business $business,
        string $email,
        string $name,
        Role $role,
        string $password,
    ): void {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => $password, 'is_active' => true, 'platform_role' => null],
        );

        Membership::query()->updateOrCreate(
            ['business_id' => $business->getKey(), 'user_id' => $user->getKey()],
            ['role' => $role, 'is_active' => true],
        );
    }

    private function seedCatalog(Business $business, User $owner): void
    {
        $pantry = Category::query()->firstOrCreate(
            ['business_id' => $business->getKey(), 'name' => 'Pantry'],
            ['is_active' => true],
        );
        $products = [
            ['sku' => 'RICE-001', 'barcode' => '480000000001', 'name' => 'Premium Rice 1kg', 'price_minor' => 6800, 'cost_minor' => 5600, 'quantity' => 8, 'threshold' => 5],
            ['sku' => 'SARDINES-001', 'barcode' => '480000000002', 'name' => 'Sardines 155g', 'price_minor' => 2800, 'cost_minor' => 2200, 'quantity' => 3, 'threshold' => 5],
        ];

        foreach ($products as $fixture) {
            $product = Product::query()->firstOrCreate(
                ['business_id' => $business->getKey(), 'sku' => $fixture['sku']],
                [
                    'category_id' => $pantry->getKey(),
                    'barcode' => $fixture['barcode'],
                    'name' => $fixture['name'],
                    'price_minor' => $fixture['price_minor'],
                    'cost_minor' => $fixture['cost_minor'],
                    'low_stock_threshold' => $fixture['threshold'],
                    'is_active' => true,
                ],
            );
            $stock = InventoryStock::query()->firstOrCreate(
                ['business_id' => $business->getKey(), 'product_id' => $product->getKey()],
                ['quantity' => $fixture['quantity'], 'version' => 1],
            );
            InventoryMovement::query()->firstOrCreate(
                ['business_id' => $business->getKey(), 'product_id' => $product->getKey(), 'reason' => 'ADJUSTMENT', 'note' => 'Initial development fixture'],
                [
                    'actor_user_id' => $owner->getKey(),
                    'delta' => $stock->quantity,
                    'quantity_before' => 0,
                    'quantity_after' => $stock->quantity,
                ],
            );
            if ($stock->quantity <= $product->low_stock_threshold) {
                ReorderAlert::query()->updateOrCreate(
                    ['business_id' => $business->getKey(), 'product_id' => $product->getKey()],
                    [
                        'status' => ReorderAlertStatus::Open,
                        'threshold' => $product->low_stock_threshold,
                        'observed_quantity' => $stock->quantity,
                        'opened_at' => now(),
                        'resolved_at' => null,
                    ],
                );
            }
        }
    }
}
