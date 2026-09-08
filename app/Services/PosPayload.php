<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleLine;

class PosPayload
{
    /** @return array<string, mixed> */
    public static function sale(Sale $sale): array
    {
        $sale->loadMissing(['lines', 'business']);

        return [
            'id' => (string) $sale->getKey(),
            'code' => $sale->sale_number,
            'receiptNumber' => $sale->receipt_number,
            'businessName' => $sale->business->name,
            'lines' => $sale->lines->map(fn (SaleLine $line): array => [
                'productId' => (string) $line->product_id,
                'sku' => $line->sku,
                'name' => $line->product_name,
                'unitPrice' => $line->unit_price_minor / 100,
                'quantity' => $line->quantity,
                'lineDiscount' => $line->line_discount_minor / 100,
                'lineTotal' => $line->line_total_minor / 100,
            ])->all(),
            'subtotal' => $sale->subtotal_minor / 100,
            'discountTotal' => $sale->discount_total_minor / 100,
            'taxTotal' => $sale->tax_total_minor / 100,
            'taxRate' => $sale->tax_rate_basis_points / 100,
            'grandTotal' => $sale->grand_total_minor / 100,
            'paymentMethod' => $sale->payment_method->value,
            'paymentReference' => $sale->payment_reference,
            'tendered' => $sale->tendered_minor === null ? null : $sale->tendered_minor / 100,
            'change' => $sale->change_minor === null ? null : $sale->change_minor / 100,
            'cashierId' => $sale->cashier_user_id === null ? null : (string) $sale->cashier_user_id,
            'cashierName' => $sale->cashier_name,
            'completedAt' => $sale->completed_at->toIso8601String(),
        ];
    }
}
