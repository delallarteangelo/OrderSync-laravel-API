<?php

namespace Tests\Feature\Api;

use App\Enums\BusinessStatus;
use App\Enums\OrderStatus;
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
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class CustomerOrderConcurrencyTest extends TestCase
{
    use DatabaseMigrations;

    public function test_simultaneous_confirmation_deducts_stock_exactly_once(): void
    {
        $business = Business::query()->create([
            'name' => 'Concurrent Store',
            'slug' => 'concurrent-store',
            'status' => BusinessStatus::Active,
            'approved_at' => now(),
        ]);
        $plan = SubscriptionPlan::query()->where('code', 'STANDARD')->firstOrFail();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(),
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
        ]);
        $actor = User::factory()->create();
        $customer = User::factory()->create();
        Membership::query()->create([
            'business_id' => $business->getKey(),
            'user_id' => $actor->getKey(),
            'role' => Role::Cashier,
        ]);
        Membership::query()->create([
            'business_id' => $business->getKey(),
            'user_id' => $customer->getKey(),
            'role' => Role::Customer,
        ]);
        $category = Category::query()->create([
            'business_id' => $business->getKey(),
            'name' => 'Pantry',
        ]);
        $product = Product::query()->create([
            'business_id' => $business->getKey(),
            'category_id' => $category->getKey(),
            'sku' => 'CONCURRENT-1',
            'name' => 'Rice',
            'price_minor' => 5000,
            'low_stock_threshold' => 0,
            'is_active' => true,
        ]);
        InventoryStock::query()->create([
            'business_id' => $business->getKey(),
            'product_id' => $product->getKey(),
            'quantity' => 10,
        ]);
        $order = Order::query()->create([
            'business_id' => $business->getKey(),
            'customer_user_id' => $customer->getKey(),
            'customer_name' => $customer->name,
            'customer_email' => $customer->email,
            'order_number' => 'ORD-CONCURRENT-1',
            'status' => OrderStatus::Pending,
            'fulfillment_method' => 'PICKUP',
            'subtotal_minor' => 10000,
            'total_minor' => 10000,
            'idempotency_key' => 'concurrent-order',
            'request_fingerprint' => hash('sha256', 'concurrent-order'),
            'placed_at' => now(),
        ]);
        $order->lines()->create([
            'business_id' => $business->getKey(),
            'product_id' => $product->getKey(),
            'sku' => $product->sku,
            'product_name' => $product->name,
            'unit_price_minor' => 5000,
            'quantity' => 2,
            'line_total_minor' => 10000,
        ]);
        $order->statusEvents()->create([
            'business_id' => $business->getKey(),
            'actor_user_id' => $customer->getKey(),
            'status' => OrderStatus::Pending,
            'actor_name' => $customer->name,
        ]);

        $environment = [
            'APP_ENV' => 'testing',
            'DB_CONNECTION' => 'pgsql',
            'DB_HOST' => (string) config('database.connections.pgsql.host'),
            'DB_PORT' => (string) config('database.connections.pgsql.port'),
            'DB_DATABASE' => (string) config('database.connections.pgsql.database'),
            'DB_USERNAME' => (string) config('database.connections.pgsql.username'),
            'DB_PASSWORD' => (string) config('database.connections.pgsql.password'),
        ];
        $workers = collect(range(1, 4))->map(fn (): Process => new Process([
            PHP_BINARY,
            base_path('tests/Support/confirm_order_worker.php'),
            (string) $order->getKey(),
            (string) $actor->getKey(),
        ], base_path(), $environment))->all();

        foreach ($workers as $worker) {
            $worker->start();
        }
        foreach ($workers as $worker) {
            $worker->wait();
            $this->assertSame(0, $worker->getExitCode(), $worker->getErrorOutput());
        }

        $results = collect($workers)->map(fn (Process $worker): string => trim($worker->getOutput()))->sort()->values()->all();
        $this->assertSame(['CONFIRMED', 'ILLEGAL_TRANSITION', 'ILLEGAL_TRANSITION', 'ILLEGAL_TRANSITION'], $results);
        $this->assertDatabaseHas('orders', ['id' => $order->getKey(), 'status' => 'CONFIRMED']);
        $this->assertDatabaseHas('inventory_stocks', [
            'product_id' => $product->getKey(),
            'quantity' => 8,
            'version' => 1,
        ]);
        $this->assertDatabaseCount('inventory_movements', 1);
        $this->assertDatabaseCount('order_status_events', 2);
    }
}
