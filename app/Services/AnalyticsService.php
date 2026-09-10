<?php

namespace App\Services;

use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Models\Business;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /** @return array<int, array<string, int|float|string>> */
    public function sales(Business $business, string $bucket, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $timezone = $business->timezone;
        $pos = DB::table('sales')->where('business_id', $business->getKey())
            ->whereBetween('completed_at', [$from, $to])
            ->selectRaw($this->bucketExpression('completed_at', $bucket).' AS bucket, 1 AS transaction_count, subtotal_minor AS gross_minor, discount_total_minor AS discount_minor, grand_total_minor AS net_minor', [$timezone]);
        $orders = DB::table('orders')->where('business_id', $business->getKey())
            ->where('status', OrderStatus::Completed->value)
            ->whereBetween('completed_at', [$from, $to])
            ->selectRaw($this->bucketExpression('completed_at', $bucket).' AS bucket, 1 AS transaction_count, subtotal_minor AS gross_minor, 0 AS discount_minor, total_minor AS net_minor', [$timezone]);

        return DB::query()->fromSub($pos->unionAll($orders), 'transactions')
            ->selectRaw('bucket, SUM(transaction_count)::int AS sales_count, SUM(gross_minor)::bigint AS gross_minor, SUM(discount_minor)::bigint AS discount_minor, SUM(net_minor)::bigint AS net_minor')
            ->groupBy('bucket')->orderBy('bucket')->get()
            ->map(fn ($row): array => [
                'bucket' => $row->bucket,
                'salesCount' => (int) $row->sales_count,
                'grossTotal' => (int) $row->gross_minor / 100,
                'discountTotal' => (int) $row->discount_minor / 100,
                'netTotal' => (int) $row->net_minor / 100,
            ])->all();
    }

    /** @return array<int, array<string, int|string>> */
    public function orders(Business $business, string $bucket, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $source = DB::table('orders')->where('business_id', $business->getKey())
            ->whereBetween('placed_at', [$from, $to])
            ->selectRaw($this->bucketExpression('placed_at', $bucket).' AS bucket, status', [$business->timezone]);
        $rows = DB::query()->fromSub($source, 'bucketed_orders')
            ->selectRaw('bucket, status, COUNT(*)::int AS aggregate')
            ->groupBy('bucket', 'status')->orderBy('bucket')->get();

        return $rows->groupBy('bucket')->map(function (Collection $group, string $key): array {
            $counts = $group->pluck('aggregate', 'status');

            return [
                'bucket' => $key,
                'pending' => (int) ($counts[OrderStatus::Pending->value] ?? 0),
                'confirmed' => (int) ($counts[OrderStatus::Confirmed->value] ?? 0),
                'preparing' => (int) ($counts[OrderStatus::Preparing->value] ?? 0),
                'readyForPickup' => (int) ($counts[OrderStatus::ReadyForPickup->value] ?? 0),
                'completed' => (int) ($counts[OrderStatus::Completed->value] ?? 0),
                'rejected' => (int) ($counts[OrderStatus::Rejected->value] ?? 0),
                'cancelled' => (int) ($counts[OrderStatus::Cancelled->value] ?? 0),
                'total' => (int) $group->sum('aggregate'),
            ];
        })->values()->all();
    }

    /** @return array<int, array<string, int|float|string>> */
    public function inventory(Business $business, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $movements = DB::table('inventory_movements')->where('business_id', $business->getKey())
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('product_id, COALESCE(SUM(delta), 0)::int AS net_movement, COALESCE(SUM(CASE WHEN reason IN (?, ?) THEN -delta ELSE 0 END), 0)::int AS units_sold, COALESCE(SUM(CASE WHEN reason = ? THEN delta ELSE 0 END), 0)::int AS units_restocked', [InventoryReason::PosSale->value, InventoryReason::OrderConfirmed->value, InventoryReason::Restock->value])
            ->groupBy('product_id')->get()->keyBy('product_id');

        return Product::query()->where('business_id', $business->getKey())
            ->with(['category', 'stock'])->orderBy('name')->get()
            ->map(function (Product $product) use ($movements): array {
                $stock = $product->stock?->quantity ?? 0;
                $movement = $movements->get($product->getKey());

                return [
                    'productId' => (string) $product->getKey(),
                    'productName' => $product->name,
                    'category' => $product->category->name,
                    'stockOnHand' => $stock,
                    'threshold' => $product->low_stock_threshold,
                    'status' => $stock === 0 ? 'OUT' : ($stock <= $product->low_stock_threshold ? 'LOW' : 'OK'),
                    'unitsSold' => (int) ($movement?->units_sold ?? 0),
                    'unitsRestocked' => (int) ($movement?->units_restocked ?? 0),
                    'netMovement' => (int) ($movement?->net_movement ?? 0),
                    'retailValue' => ($stock * $product->price_minor) / 100,
                    'costValue' => $product->cost_minor === null ? 0 : ($stock * $product->cost_minor) / 100,
                ];
            })->all();
    }

    /** @return array<string, array<int, array<string, int|float|string|null>>> */
    public function overview(Business $business, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $pos = DB::table('sale_lines')->join('sales', 'sales.id', '=', 'sale_lines.sale_id')
            ->where('sales.business_id', $business->getKey())->whereBetween('sales.completed_at', [$from, $to])
            ->selectRaw('sale_lines.product_id, SUM(sale_lines.quantity)::int AS quantity, SUM(sale_lines.line_total_minor)::bigint AS revenue_minor, COUNT(DISTINCT sale_lines.sale_id)::int AS transactions')
            ->groupBy('sale_lines.product_id');
        $orders = DB::table('order_lines')->join('orders', 'orders.id', '=', 'order_lines.order_id')
            ->where('orders.business_id', $business->getKey())->where('orders.status', OrderStatus::Completed->value)
            ->whereBetween('orders.completed_at', [$from, $to])
            ->selectRaw('order_lines.product_id, SUM(order_lines.quantity)::int AS quantity, SUM(order_lines.line_total_minor)::bigint AS revenue_minor, COUNT(DISTINCT order_lines.order_id)::int AS transactions')
            ->groupBy('order_lines.product_id');
        $performance = DB::query()->fromSub($pos->unionAll($orders), 'performance')
            ->selectRaw('product_id, SUM(quantity)::int AS quantity, SUM(revenue_minor)::bigint AS revenue_minor, SUM(transactions)::int AS transactions')
            ->groupBy('product_id')->get()->keyBy('product_id');
        $products = Product::query()->where('business_id', $business->getKey())->where('is_active', true)->orderBy('name')->get()
            ->map(function (Product $product) use ($performance): array {
                $row = $performance->get($product->getKey());

                return [
                    'productId' => (string) $product->getKey(),
                    'productName' => $product->name,
                    'quantitySold' => (int) ($row?->quantity ?? 0),
                    'transactionCount' => (int) ($row?->transactions ?? 0),
                    'revenue' => (int) ($row?->revenue_minor ?? 0) / 100,
                ];
            });
        $customers = DB::table('orders')->where('business_id', $business->getKey())
            ->where('status', OrderStatus::Completed->value)->whereBetween('completed_at', [$from, $to])
            ->selectRaw('customer_user_id, customer_name, customer_email, COUNT(*)::int AS order_count, SUM(total_minor)::bigint AS revenue_minor')
            ->groupBy('customer_user_id', 'customer_name', 'customer_email')->orderByDesc('revenue_minor')->limit(25)->get()
            ->map(fn ($row): array => [
                'customerId' => $row->customer_user_id === null ? null : (string) $row->customer_user_id,
                'customerName' => $row->customer_name,
                'customerEmail' => $row->customer_email,
                'orderCount' => (int) $row->order_count,
                'revenue' => (int) $row->revenue_minor / 100,
            ])->all();

        return [
            'bestSellingProducts' => $products->sortByDesc(fn (array $row): int => $row['quantitySold'])->take(10)->values()->all(),
            'slowMovingProducts' => $products->sortBy([['quantitySold', 'asc'], ['productName', 'asc']])->take(10)->values()->all(),
            'customerTrends' => $customers,
        ];
    }

    /** @return array<string, mixed> */
    public function dashboard(Business $business, User $user): array
    {
        $today = CarbonImmutable::now($business->timezone)->startOfDay();
        $from = $today->subDays(6)->utc();
        $to = $today->endOfDay()->utc();
        $salesRows = collect($this->sales($business, 'day', $from, $to))->keyBy('bucket');
        $sevenDay = collect(range(0, 6))->map(function (int $offset) use ($today, $salesRows): array {
            $key = $today->addDays($offset - 6)->format('Y-m-d');

            return $salesRows->get($key, ['bucket' => $key, 'salesCount' => 0, 'grossTotal' => 0, 'discountTotal' => 0, 'netTotal' => 0]);
        })->all();
        $todayRow = $salesRows->get($today->format('Y-m-d'), ['salesCount' => 0, 'netTotal' => 0]);
        $todayUtc = $today->utc();
        $tomorrowUtc = $today->addDay()->utc();
        $mySales = Sale::query()->where('business_id', $business->getKey())->where('cashier_user_id', $user->getKey())
            ->whereBetween('completed_at', [$todayUtc, $tomorrowUtc])->with(['lines', 'business'])->latest('completed_at')->limit(8)->get();
        $recentOrders = Order::query()->where('business_id', $business->getKey())->with(['business', 'lines', 'statusEvents'])->latest('placed_at')->limit(6)->get();
        $recentMovements = InventoryMovement::query()->where('business_id', $business->getKey())->with(['product', 'actor'])->latest('created_at')->limit(6)->get();
        $lowStock = Product::query()->where('products.business_id', $business->getKey())->where('products.is_active', true)
            ->join('inventory_stocks', 'inventory_stocks.product_id', '=', 'products.id')
            ->whereColumn('inventory_stocks.quantity', '<=', 'products.low_stock_threshold')->orderBy('inventory_stocks.quantity')->limit(20)
            ->get(['products.id', 'products.name', 'products.sku', 'products.low_stock_threshold', 'inventory_stocks.quantity']);

        return [
            'today' => ['total' => $todayRow['netTotal'], 'count' => $todayRow['salesCount'], 'itemsSold' => $this->itemsSold($business, $todayUtc, $tomorrowUtc)],
            'openOrdersCount' => Order::query()->where('business_id', $business->getKey())->whereIn('status', [OrderStatus::Pending, OrderStatus::Confirmed, OrderStatus::Preparing, OrderStatus::ReadyForPickup])->count(),
            'lowStock' => $lowStock->map(fn ($row): array => ['productId' => (string) $row->id, 'productName' => $row->name, 'sku' => $row->sku, 'stockOnHand' => (int) $row->quantity, 'threshold' => (int) $row->low_stock_threshold])->all(),
            'sevenDaySales' => $sevenDay,
            'recentOrders' => $recentOrders->map(fn (Order $order): array => OrderPayload::order($order))->all(),
            'recentMovements' => $recentMovements->map(fn (InventoryMovement $movement): array => CatalogPayload::movement($movement))->all(),
            'pendingOrdersCount' => Order::query()->where('business_id', $business->getKey())->where('status', OrderStatus::Pending)->count(),
            'mySales' => $mySales->map(fn (Sale $sale): array => PosPayload::sale($sale))->all(),
            'mySalesTotal' => $mySales->sum('grand_total_minor') / 100,
        ];
    }

    private function itemsSold(Business $business, CarbonImmutable $from, CarbonImmutable $to): int
    {
        $pos = (int) DB::table('sale_lines')->join('sales', 'sales.id', '=', 'sale_lines.sale_id')
            ->where('sales.business_id', $business->getKey())->whereBetween('sales.completed_at', [$from, $to])->sum('sale_lines.quantity');
        $orders = (int) DB::table('order_lines')->join('orders', 'orders.id', '=', 'order_lines.order_id')
            ->where('orders.business_id', $business->getKey())->where('orders.status', OrderStatus::Completed->value)
            ->whereBetween('orders.completed_at', [$from, $to])->sum('order_lines.quantity');

        return $pos + $orders;
    }

    private function bucketExpression(string $column, string $bucket): string
    {
        return match ($bucket) {
            'week' => "to_char(date_trunc('week', {$column} AT TIME ZONE ?), 'YYYY-MM-DD')",
            'month' => "to_char(date_trunc('month', {$column} AT TIME ZONE ?), 'YYYY-MM')",
            default => "to_char({$column} AT TIME ZONE ?, 'YYYY-MM-DD')",
        };
    }
}
