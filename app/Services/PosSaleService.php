<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Enums\Role;
use App\Exceptions\PosSaleException;
use App\Models\Business;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PosSaleService
{
    public function __construct(
        private readonly CatalogInventoryService $inventory,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array{sale:Sale, replayed:bool}
     */
    public function finalize(
        Business $business,
        User $cashier,
        Role $role,
        Request $request,
        array $payload,
        string $idempotencyKey,
    ): array {
        $paymentMethod = PaymentMethod::from($payload['paymentMethod']);
        $normalizedLines = array_map(fn (array $line): array => [
            'product_id' => (int) $line['productId'],
            'quantity' => (int) $line['quantity'],
            'line_discount_minor' => $this->minor($line['lineDiscount'] ?? 0),
        ], $payload['lines']);
        usort($normalizedLines, fn (array $left, array $right): int => $left['product_id'] <=> $right['product_id']);
        $tenderedMinor = array_key_exists('tendered', $payload) && $payload['tendered'] !== null
            ? $this->minor($payload['tendered'])
            : null;
        $paymentReference = isset($payload['paymentReference']) ? trim($payload['paymentReference']) : null;
        $fingerprint = hash('sha256', json_encode([
            'lines' => $normalizedLines,
            'payment_method' => $paymentMethod->value,
            'tendered_minor' => $tenderedMinor,
            'payment_reference' => $paymentReference,
        ], JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($business, $cashier, $role, $request, $idempotencyKey, $fingerprint, $paymentMethod, $normalizedLines, $tenderedMinor, $paymentReference): array {
            DB::select('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', ["pos:{$business->getKey()}:{$idempotencyKey}"]);
            $existing = Sale::query()->where('business_id', $business->getKey())
                ->where('idempotency_key', $idempotencyKey)->with(['lines', 'business'])->first();
            if ($existing) {
                if (! hash_equals($existing->request_fingerprint, $fingerprint)) {
                    throw new PosSaleException('IDEMPOTENCY_KEY_REUSED', 'This checkout key was already used for a different sale.');
                }

                return ['sale' => $existing, 'replayed' => true];
            }

            if ($role !== Role::BusinessOwner && collect($normalizedLines)->contains(fn (array $line): bool => $line['line_discount_minor'] > 0)) {
                throw new PosSaleException('DISCOUNT_FORBIDDEN', 'Only a Business Owner may apply POS discounts.', 403);
            }

            $receiptNumber = $this->number('R');
            $products = $this->inventory->deductForSale(
                $business,
                $cashier,
                array_map(fn (array $line): array => ['product_id' => $line['product_id'], 'quantity' => $line['quantity']], $normalizedLines),
                $receiptNumber,
            );

            $subtotalMinor = 0;
            $discountTotalMinor = 0;
            $lineRows = [];
            foreach ($normalizedLines as $line) {
                /** @var Product $product */
                $product = $products[$line['product_id']];
                $grossMinor = $product->price_minor * $line['quantity'];
                if ($line['line_discount_minor'] > $grossMinor) {
                    throw new PosSaleException('INVALID_DISCOUNT', "The discount for {$product->name} exceeds its line total.", 422, ['lines' => ["{$product->name} has an invalid discount."]]);
                }
                $subtotalMinor += $grossMinor;
                $discountTotalMinor += $line['line_discount_minor'];
                $lineRows[] = [
                    'business_id' => $business->getKey(),
                    'product_id' => $product->getKey(),
                    'sku' => $product->sku,
                    'product_name' => $product->name,
                    'unit_price_minor' => $product->price_minor,
                    'quantity' => $line['quantity'],
                    'line_discount_minor' => $line['line_discount_minor'],
                    'line_total_minor' => $grossMinor - $line['line_discount_minor'],
                ];
            }

            $taxTotalMinor = 0;
            $grandTotalMinor = $subtotalMinor - $discountTotalMinor + $taxTotalMinor;
            if ($paymentMethod === PaymentMethod::Cash) {
                if ($tenderedMinor === null || $tenderedMinor < $grandTotalMinor) {
                    throw new PosSaleException('INSUFFICIENT_TENDER', 'Cash tendered must cover the sale total.', 422, ['tendered' => ['Cash tendered must cover the sale total.']]);
                }
                $changeMinor = $tenderedMinor - $grandTotalMinor;
                $reference = null;
            } else {
                if (! $paymentReference) {
                    throw new PosSaleException('PAYMENT_REFERENCE_REQUIRED', 'A payment reference is required for recorded non-cash payments.', 422, ['paymentReference' => ['A payment reference is required.']]);
                }
                $changeMinor = null;
                $reference = $paymentReference;
            }

            $sale = Sale::query()->create([
                'business_id' => $business->getKey(),
                'cashier_user_id' => $cashier->getKey(),
                'cashier_name' => $cashier->name,
                'sale_number' => $this->number('S'),
                'receipt_number' => $receiptNumber,
                'status' => 'COMPLETED',
                'subtotal_minor' => $subtotalMinor,
                'discount_total_minor' => $discountTotalMinor,
                'tax_total_minor' => $taxTotalMinor,
                'grand_total_minor' => $grandTotalMinor,
                'tax_rate_basis_points' => 0,
                'payment_method' => $paymentMethod,
                'tendered_minor' => $paymentMethod === PaymentMethod::Cash ? $tenderedMinor : null,
                'change_minor' => $changeMinor,
                'payment_reference' => $reference,
                'idempotency_key' => $idempotencyKey,
                'request_fingerprint' => $fingerprint,
                'completed_at' => now(),
            ]);
            $sale->lines()->createMany($lineRows);
            $this->audit->record('pos.sale_completed', $request, $cashier, $business, Sale::class, $sale->getKey(), [
                'receipt_number' => $receiptNumber,
                'grand_total_minor' => $grandTotalMinor,
                'payment_method' => $paymentMethod->value,
                'line_count' => count($lineRows),
            ]);

            return ['sale' => $sale->fresh(['lines', 'business']), 'replayed' => false];
        });
    }

    private function minor(int|float|string $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }

    private function number(string $prefix): string
    {
        return $prefix.'-'.now()->format('Ymd').'-'.mb_strtoupper(Str::ulid()->toBase32());
    }
}
