<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\RecordedPaymentStatus;
use App\Exceptions\OrderWorkflowException;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderSettlementService
{
    public function __construct(private readonly AuditLogger $audit, private readonly MessagingService $messaging) {}

    /** @return array{wallet:int,counter:int,received:int,refunded:int,balance:int} */
    public function summary(Order $order): array
    {
        $wallet = (int) $order->payments()->where('status', RecordedPaymentStatus::Verified->value)
            ->selectRaw('COALESCE(SUM(COALESCE(verified_amount_minor, amount_minor)), 0) AS paid')->value('paid');
        $counter = (int) $order->counterPayments()->sum('amount_minor');
        $received = $wallet + $counter;
        $refunded = (int) $order->refunds()->sum('amount_minor');

        return ['wallet' => $wallet, 'counter' => $counter, 'received' => $received,
            'refunded' => $refunded, 'balance' => max(0, $order->total_minor - $received)];
    }

    public function collectCounter(Order $order, User $actor, Request $request, int $amountMinor, string $reference): Order
    {
        return DB::transaction(function () use ($order, $actor, $request, $amountMinor, $reference): Order {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->getKey());
            if ($locked->status !== OrderStatus::ReadyForPickup || $locked->balance_collection_method !== 'CASH_AT_PICKUP') {
                throw new OrderWorkflowException('COUNTER_PAYMENT_NOT_ALLOWED', 'Counter payment is allowed only when this order is ready for pickup and cash at pickup was chosen.');
            }
            if ($locked->payments()->where('status', RecordedPaymentStatus::Submitted->value)->exists()) {
                throw new OrderWorkflowException('PAYMENT_REVIEW_PENDING', 'Review the outstanding wallet proof before collecting the pickup balance.');
            }
            $balance = $this->summary($locked)['balance'];
            if ($amountMinor < 1 || $amountMinor > $balance) {
                throw new OrderWorkflowException('AMOUNT_EXCEEDS_BALANCE', 'Record an amount no greater than the remaining balance.', 422);
            }
            $locked->counterPayments()->create([
                'business_id' => $locked->business_id, 'received_by_user_id' => $actor->getKey(),
                'amount_minor' => $amountMinor, 'reference_number' => trim($reference), 'received_at' => now(),
            ]);
            $this->audit->record('order.counter_payment_collected', $request, $actor, $locked->business, Order::class, $locked->getKey(), ['amount_minor' => $amountMinor]);
            $this->messaging->appendOrderActivity($locked, "Cash payment of ₱".number_format($amountMinor / 100, 2)." was received at pickup.", \App\Enums\UserNotificationType::Payment, 'Pickup balance received', $actor->getKey());

            return $locked->fresh();
        });
    }

    public function recordRefund(Order $order, User $actor, Request $request, string $method, string $reference, int $amountMinor): Order
    {
        return DB::transaction(function () use ($order, $actor, $request, $method, $reference, $amountMinor): Order {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->getKey());
            if ($locked->status !== OrderStatus::RefundPending) {
                throw new OrderWorkflowException('REFUND_NOT_ALLOWED', 'This order is not awaiting a refund.');
            }
            $summary = $this->summary($locked);
            $outstanding = $summary['received'] - $summary['refunded'];
            if ($amountMinor < 1 || $amountMinor > $outstanding) {
                throw new OrderWorkflowException('REFUND_AMOUNT_MISMATCH', 'The recorded refund must not exceed the amount still owed to the customer.', 422);
            }
            $locked->refunds()->create(['business_id' => $locked->business_id, 'refunded_by_user_id' => $actor->getKey(),
                'amount_minor' => $amountMinor, 'method' => $method, 'reference_number' => trim($reference), 'refunded_at' => now()]);
            if ($amountMinor === $outstanding) {
                $locked->status = OrderStatus::Refunded;
                $locked->save();
                $locked->statusEvents()->create(['business_id' => $locked->business_id, 'actor_user_id' => $actor->getKey(),
                    'status' => OrderStatus::Refunded, 'actor_name' => $actor->name, 'note' => "Final refund reference: {$reference}"]);
            }
            $this->audit->record('order.refund_recorded', $request, $actor, $locked->business, Order::class, $locked->getKey(), ['amount_minor' => $amountMinor, 'method' => $method]);
            $this->messaging->appendOrderActivity($locked, "Order refund of ₱".number_format($amountMinor / 100, 2)." was recorded. Reference: {$reference}.", \App\Enums\UserNotificationType::Payment, 'Order refund recorded', $actor->getKey());

            return $locked->fresh();
        });
    }
}
