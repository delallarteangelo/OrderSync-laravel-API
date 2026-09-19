<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessSetting;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BusinessSettingsController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function show(Request $request): JsonResponse
    {
        $business = $this->business($request);

        return response()->json($this->payload($business, $business->settings()->firstOrNew()));
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'storeName' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'taxRate' => ['sometimes', 'numeric', 'min:0', 'max:100', 'decimal:0,2'],
            'currencySymbol' => ['sometimes', Rule::in(['₱'])],
            'receiptHeader' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'receiptFooter' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'lowStockDefault' => ['sometimes', 'integer', 'min:0', 'max:4294967295'],
        ]);
        $business = $this->business($request);

        DB::transaction(function () use ($business, $validated, $request): void {
            if (array_key_exists('storeName', $validated)) {
                $business->update(['name' => trim($validated['storeName'])]);
            }
            $settings = $business->settings()->firstOrCreate([]);
            $fields = [
                'address' => 'address',
                'phone' => 'phone',
                'email' => 'email',
                'receiptHeader' => 'receipt_header',
                'receiptFooter' => 'receipt_footer',
                'lowStockDefault' => 'low_stock_default',
            ];
            foreach ($fields as $input => $column) {
                if (array_key_exists($input, $validated)) {
                    $settings->$column = $validated[$input] ?? '';
                }
            }
            if (array_key_exists('taxRate', $validated)) {
                $settings->tax_rate_basis_points = (int) round(((float) $validated['taxRate']) * 100);
            }
            $settings->save();
            $this->audit->record('business.settings_updated', $request, $request->user(), $business, Business::class, $business->getKey());
        });

        return response()->json($this->payload($business->refresh(), $business->settings()->firstOrFail()));
    }

    /** @return array<string, mixed> */
    private function payload(Business $business, BusinessSetting $settings): array
    {
        return [
            'storeName' => $business->name,
            'address' => $settings->address,
            'phone' => $settings->phone,
            'email' => $settings->email,
            'taxRate' => $settings->tax_rate_basis_points / 100,
            'currencySymbol' => '₱',
            'receiptHeader' => $settings->receipt_header,
            'receiptFooter' => $settings->receipt_footer,
            'lowStockDefault' => $settings->low_stock_default,
        ];
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
