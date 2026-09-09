<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderStatusEvent;
use App\Models\RecordedPayment;

class OrderPayload
{
    /** @return array<string, mixed> */
    public static function order(Order $order): array
    {
        $order->loadMissing(['business', 'lines', 'statusEvents', 'payments.business', 'payments.submitter', 'payments.reviewer', 'payments.reviewEvents']);

        return [
            'id' => (string) $order->getKey(),
            'code' => $order->order_number,
            'business' => [
                'id' => (string) $order->business_id,
                'name' => $order->business->name,
                'slug' => $order->business->slug,
            ],
            'customer' => [
                'id' => $order->customer_user_id === null ? null : (string) $order->customer_user_id,
                'name' => $order->customer_name,
                'email' => $order->customer_email,
            ],
            'items' => $order->lines->map(fn (OrderLine $line): array => [
                'productId' => (string) $line->product_id,
                'sku' => $line->sku,
                'productName' => $line->product_name,
                'quantity' => $line->quantity,
                'unitPrice' => $line->unit_price_minor / 100,
                'lineTotal' => $line->line_total_minor / 100,
            ])->all(),
            'subtotal' => $order->subtotal_minor / 100,
            'total' => $order->total_minor / 100,
            'fulfillmentMethod' => $order->fulfillment_method,
            'status' => $order->status->value,
            'placedAt' => $order->placed_at->toIso8601String(),
            'updatedAt' => $order->updated_at->toIso8601String(),
            'statusHistory' => $order->statusEvents->sortBy('created_at')->values()->map(fn (OrderStatusEvent $event): array => [
                'status' => $event->status->value,
                'at' => $event->created_at->toIso8601String(),
                'actorName' => $event->actor_name,
                'note' => $event->note,
            ])->all(),
            'payments' => $order->payments->sortByDesc('submitted_at')->values()->map(fn (RecordedPayment $payment): array => RecordedPaymentPayload::payment($payment))->all(),
        ];
    }
}
