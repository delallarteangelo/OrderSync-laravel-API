<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Business;
use App\Models\Membership;
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
            $this->command?->warn('Set ORDERSYNC_DEV_SEED_PASSWORD to at least 12 characters to seed local Phase 2 identities.');

            return;
        }

        $business = Business::query()->firstOrCreate(
            ['slug' => 'tonettes-minimart'],
            ['name' => "Tonette's Minimart", 'timezone' => 'Asia/Manila'],
        );

        $this->seedMember($business, 'owner@ordersync.local', 'Local Business Owner', Role::BusinessOwner, $password);
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

        $this->command?->info('Seeded local-only Phase 2 identities for OrderSync.');
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
}
