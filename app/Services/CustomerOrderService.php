<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\RecordedPaymentStatus;
use App\Enums\UserNotificationType;
use App\Exceptions\OrderWorkflowException;
use App\Models\Business;
use App\Models\Order;
use App\Models\PaymentInstruction;
use App\Models\Product;
use App\Models\User;
use App\Support\Database\DatabaseDialect;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomerOrderService
{
    public function __construct(
        private readonly CatalogInventoryService $inventory,
        private readonly AuditLogger $audit,
        private readonly MessagingService $messaging,
        private readonly OrderSettlementService $settlement,
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

        return DatabaseDialect::withTransactionLock(
            "order:{$business->getKey()}:{$customer->getKey()}:{$idempotencyKey}",
            function () use ($business, $customer, $request, $idempotencyKey, $lines, $fingerprint): array {
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
                $this->messaging->appendOrderActivity(
                    $order,
                    "Order {$order->order_number} was placed for pickup.",
                    UserNotificationType::Order,
                    "New order {$order->order_number}",
                    $customer->getKey(),
                );

                return ['order' => $order->fresh(['business', 'lines', 'statusEvents']), 'replayed' => false];
            },
        );
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
            if ($locked->payments()->where('status', RecordedPaymentStatus::Submitted->value)->exists()) {
                throw new OrderWorkflowException('PAYMENT_REVIEW_PENDING', 'The submitted wallet proof must be reviewed before cancellation.');
            }
            $next = $this->settlement->summary($locked)['received'] > 0 ? OrderStatus::RefundPending : OrderStatus::Cancelled;

            return $this->applyStatus($locked, $next, $customer, $request, $note);
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
            if ($next === OrderStatus::Rejected && $locked->payments()->where('status', RecordedPaymentStatus::Submitted->value)->exists()) {
                throw new OrderWorkflowException('PAYMENT_REVIEW_PENDING', 'Review the submitted wallet proof before rejecting the order.');
            }
            if ($next === OrderStatus::Rejected && $this->settlement->summary($locked)['received'] > 0) {
                $next = OrderStatus::RefundPending;
            }
            if ($next === OrderStatus::Confirmed) {
                if ($locked->payments()->where('status', RecordedPaymentStatus::Submitted->value)->exists()) {
                    throw new OrderWorkflowException('PAYMENT_NOT_VERIFIED', 'Review the outstanding wallet proof before confirming this order.');
                }
                if ($locked->balance_collection_method === 'WALLET_TOPUP' && $this->settlement->summary($locked)['balance'] > 0) {
                    throw new OrderWorkflowException('TOPUP_REQUIRED', 'This customer chose wallet top-up. Confirm after the full balance is verified, or ask the customer to choose cash at pickup.');
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
                if ($this->settlement->summary($locked)['balance'] > 0) {
                    throw new OrderWorkflowException('BALANCE_DUE', 'Record the remaining payment before completing this pickup order.');
                }
                $locked->completed_at = now();
            }

            return $this->applyStatus($locked, $next, $actor, $request, $note);
        });
    }

    public function chooseBalanceMethod(Order $order, User $customer, Request $request, string $method): Order
    {
        return DB::transaction(function () use ($order, $customer, $request, $method): Order {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->getKey());
            if ($locked->customer_user_id !== $customer->getKey() || ! in_array($locked->status, [OrderStatus::Pending, OrderStatus::Confirmed, OrderStatus::Preparing], true)) {
                throw new OrderWorkflowException('BALANCE_METHOD_NOT_ALLOWED', 'The pickup balance choice can no longer be changed.');
            }
            if ($method === 'CASH_AT_PICKUP' && $locked->counterPayments()->exists()) {
                throw new OrderWorkflowException('BALANCE_METHOD_NOT_ALLOWED', 'A counter payment has already been recorded.');
            }
            if ($method === 'WALLET_TOPUP' && ! PaymentInstruction::query()->where('business_id', $locked->business_id)->where('is_active', true)->exists()) {
                throw new OrderWorkflowException('PAYMENT_METHOD_UNAVAILABLE', 'This business does not currently have an active wallet for top-ups.', 422);
            }
            $locked->balance_collection_method = $method;
            $locked->save();
            $this->audit->record('order.balance_method_changed', $request, $customer, $locked->business, Order::class, $locked->getKey(), ['method' => $method]);
            $this->messaging->appendOrderActivity($locked, $method === 'WALLET_TOPUP' ? 'Customer chose to pay the remaining balance by wallet top-up.' : 'Customer chose to pay the remaining balance in cash at pickup.', UserNotificationType::Payment, 'Pickup payment choice updated', $customer->getKey());

            return $locked->fresh();
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
        $label = mb_strtolower(str_replace('_', ' ', $status->value));
        $this->messaging->appendOrderActivity(
            $order,
            "Order {$order->order_number} is now {$label}.",
            UserNotificationType::Order,
            "Order {$order->order_number} updated",
            $actor->getKey(),
        );

        return $order->fresh(['business', 'lines', 'statusEvents']);
    }
}
