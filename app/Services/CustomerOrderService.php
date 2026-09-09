<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\RecordedPaymentStatus;
use App\Exceptions\OrderWorkflowException;
use App\Models\Business;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomerOrderService
{
    public function __construct(
        private readonly CatalogInventoryService $inventory,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array{order:Order,replayed:bool}
     */
    public function place(Business $business, User $customer, Request $request, array $payload, string $idempotencyKey): array
    {
        $lines = array_map(fn (array $line): array => [
            'product_id' => (int) $line['productId'],
            'quantity' => (int) $line['quantity'],
        ], $payload['items']);
        usort($lines, fn (array $left, array $right): int => $left['product_id'] <=> $right['product_id']);
        $fingerprint = hash('sha256', json_encode(['items' => $lines, 'fulfillment_method' => 'PICKUP'], JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($business, $customer, $request, $idempotencyKey, $lines, $fingerprint): array {
            DB::select('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', ["order:{$business->getKey()}:{$customer->getKey()}:{$idempotencyKey}"]);
            $existing = Order::query()
                ->where('business_id', $business->getKey())
                ->where('customer_user_id', $customer->getKey())
                ->where('idempotency_key', $idempotencyKey)
                ->with(['business', 'lines', 'statusEvents'])
                ->first();
            if ($existing) {
                if (! hash_equals($existing->request_fingerprint, $fingerprint)) {
                    throw new OrderWorkflowException('IDEMPOTENCY_KEY_REUSED', 'This order key was already used for a different request.');
                }

                return ['order' => $existing, 'replayed' => true];
            }

            $products = [];
            foreach ($lines as $line) {
                $product = Product::query()
                    ->where('business_id', $business->getKey())
                    ->whereKey($line['product_id'])
                    ->with('stock')
                    ->lockForUpdate()
                    ->first();
                if (! $product || ! $product->is_active) {
                    throw new OrderWorkflowException('PRODUCT_UNAVAILABLE', 'One or more products are unavailable.', 409, [
                        'items' => ["Product {$line['product_id']} is unavailable."],
                    ]);
                }
                $available = $product->stock?->quantity ?? 0;
                if ($available < $line['quantity']) {
                    throw new OrderWorkflowException('INSUFFICIENT_STOCK', 'One or more items have insufficient stock.', 409, [
                        'items' => ["{$product->name} has {$available} available; {$line['quantity']} requested."],
                    ]);
                }
                $products[$product->getKey()] = $product;
            }

            $subtotalMinor = 0;
            $rows = [];
            foreach ($lines as $line) {
                /** @var Product $product */
                $product = $products[$line['product_id']];
                $lineTotal = $product->price_minor * $line['quantity'];
                $subtotalMinor += $lineTotal;
                $rows[] = [
                    'business_id' => $business->getKey(),
                    'product_id' => $product->getKey(),
                    'sku' => $product->sku,
                    'product_name' => $product->name,
                    'unit_price_minor' => $product->price_minor,
                    'quantity' => $line['quantity'],
                    'line_total_minor' => $lineTotal,
                ];
            }

            $order = Order::query()->create([
                'business_id' => $business->getKey(),
                'customer_user_id' => $customer->getKey(),
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'order_number' => 'ORD-'.now()->format('Ymd').'-'.mb_strtoupper(Str::ulid()->toBase32()),
                'status' => OrderStatus::Pending,
                'fulfillment_method' => 'PICKUP',
                'subtotal_minor' => $subtotalMinor,
                'total_minor' => $subtotalMinor,
                'idempotency_key' => $idempotencyKey,
                'request_fingerprint' => $fingerprint,
                'placed_at' => now(),
            ]);
            $order->lines()->createMany($rows);
            $order->statusEvents()->create([
                'business_id' => $business->getKey(),
                'actor_user_id' => $customer->getKey(),
                'status' => OrderStatus::Pending,
                'actor_name' => $customer->name,
            ]);
            $this->audit->record('order.placed', $request, $customer, $business, Order::class, $order->getKey(), [
                'order_number' => $order->order_number,
                'total_minor' => $subtotalMinor,
                'line_count' => count($rows),
            ]);

            return ['order' => $order->fresh(['business', 'lines', 'statusEvents']), 'replayed' => false];
        });
    }

    public function cancel(Order $order, User $customer, Request $request, ?string $note): Order
    {
        return DB::transaction(function () use ($order, $customer, $request, $note): Order {
            $locked = Order::query()->whereKey($order->getKey())->lockForUpdate()->firstOrFail();
            if ($locked->customer_user_id !== $customer->getKey()) {
                throw new OrderWorkflowException('ORDER_NOT_FOUND', 'Order not found.', 404);
            }
            if ($locked->status !== OrderStatus::Pending) {
                throw new OrderWorkflowException('CANCELLATION_NOT_ALLOWED', 'Only a pending order can be cancelled.');
            }
            if ($locked->payments()->where('status', RecordedPaymentStatus::Verified->value)->exists()) {
                throw new OrderWorkflowException('VERIFIED_PAYMENT_EXISTS', 'A manually verified payment must be resolved by the business before cancellation.');
            }

            return $this->applyStatus($locked, OrderStatus::Cancelled, $customer, $request, $note);
        });
    }

    public function transition(Order $order, User $actor, Request $request, OrderStatus $next, ?string $note): Order
    {
        return DB::transaction(function () use ($order, $actor, $request, $next, $note): Order {
            $locked = Order::query()->whereKey($order->getKey())->lockForUpdate()->with('lines')->firstOrFail();
            $allowed = match ($locked->status) {
                OrderStatus::Pending => [OrderStatus::Confirmed, OrderStatus::Rejected],
                OrderStatus::Confirmed => [OrderStatus::Preparing],
                OrderStatus::Preparing => [OrderStatus::ReadyForPickup],
                OrderStatus::ReadyForPickup => [OrderStatus::Completed],
                default => [],
            };
            if (! in_array($next, $allowed, true)) {
                throw new OrderWorkflowException('ILLEGAL_TRANSITION', "Cannot move from {$locked->status->value} to {$next->value}.");
            }
            if ($next === OrderStatus::Rejected && ! $note) {
                throw new OrderWorkflowException('REJECTION_NOTE_REQUIRED', 'A rejection reason is required.', 422, ['note' => ['A rejection reason is required.']]);
            }
            if ($next === OrderStatus::Confirmed) {
                $hasPayments = $locked->payments()->exists();
                $hasVerifiedPayment = $locked->payments()->where('status', RecordedPaymentStatus::Verified->value)->exists();
                if ($hasPayments && ! $hasVerifiedPayment) {
                    throw new OrderWorkflowException('PAYMENT_NOT_VERIFIED', 'The submitted wallet payment must be manually verified before confirming this order.');
                }
                $this->inventory->deductForOrder(
                    $locked->business,
                    $actor,
                    $locked->lines->map(fn ($line): array => ['product_id' => $line->product_id, 'quantity' => $line->quantity])->all(),
                    $locked->order_number,
                );
                $locked->confirmed_at = now();
            }
            if ($next === OrderStatus::Completed) {
                $locked->completed_at = now();
            }

            return $this->applyStatus($locked, $next, $actor, $request, $note);
        });
    }

    private function applyStatus(Order $order, OrderStatus $status, User $actor, Request $request, ?string $note): Order
    {
        $from = $order->status;
        $order->status = $status;
        $order->save();
        $order->statusEvents()->create([
            'business_id' => $order->business_id,
            'actor_user_id' => $actor->getKey(),
            'status' => $status,
            'actor_name' => $actor->name,
            'note' => $note,
        ]);
        $this->audit->record('order.status_changed', $request, $actor, $order->business, Order::class, $order->getKey(), [
            'from_status' => $from->value,
            'to_status' => $status->value,
        ]);

        return $order->fresh(['business', 'lines', 'statusEvents']);
    }
}
