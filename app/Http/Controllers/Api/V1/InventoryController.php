<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\InventoryReason;
use App\Enums\ReorderAlertStatus;
use App\Exceptions\InsufficientStockException;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ReorderAlert;
use App\Services\CatalogInventoryService;
use App\Services\CatalogPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventoryController extends Controller
{
    public function __construct(private readonly CatalogInventoryService $inventory) {}

    public function index(Request $request): JsonResponse
    {
        $products = Product::query()->where('business_id', $this->business($request)->getKey())
            ->with(['category', 'stock', 'primaryImage'])->orderBy('name')->get();

        return response()->json(['items' => $products->map(fn (Product $product) => CatalogPayload::product($product))->all()]);
    }

    public function lowStock(Request $request): JsonResponse
    {
        $alerts = ReorderAlert::query()->where('business_id', $this->business($request)->getKey())
            ->where('status', ReorderAlertStatus::Open)->with('product.stock')->latest('opened_at')->get();

        return response()->json(['items' => $alerts->map(fn (ReorderAlert $alert) => CatalogPayload::alert($alert))->all()]);
    }

    public function movements(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $validated = $request->validate([
            'productId' => ['nullable', 'integer'],
            'reason' => ['nullable', Rule::enum(InventoryReason::class)],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);
        $movements = InventoryMovement::query()->where('business_id', $business->getKey())
            ->with(['product', 'actor'])
            ->when($validated['productId'] ?? null, fn ($query, int $productId) => $query->where('product_id', $productId))
            ->when($validated['reason'] ?? null, fn ($query, string $reason) => $query->where('reason', $reason))
            ->when($validated['from'] ?? null, fn ($query, string $from) => $query->where('created_at', '>=', $from))
            ->when($validated['to'] ?? null, fn ($query, string $to) => $query->where('created_at', '<=', $to))
            ->latest('created_at')->limit(500)->get();

        return response()->json(['items' => $movements->map(fn (InventoryMovement $movement) => CatalogPayload::movement($movement))->all()]);
    }

    public function adjust(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $request->merge(['note' => trim((string) $request->input('note'))]);
        $validated = $request->validate([
            'productId' => ['required', 'integer'],
            'delta' => ['required', 'integer', 'not_in:0'],
            'reasonCode' => ['required', Rule::in([InventoryReason::Adjustment->value])],
            'note' => ['required', 'string', 'min:3', 'max:1000'],
        ]);
        $product = Product::query()->where('business_id', $business->getKey())->findOrFail($validated['productId']);
        try {
            $movement = $this->inventory->adjust($product, $request->user(), $request, $validated['delta'], trim($validated['note']));
        } catch (InsufficientStockException $exception) {
            return response()->json(['code' => 'NEGATIVE_STOCK', 'message' => $exception->getMessage()], 409);
        }

        return response()->json([
            'product' => CatalogPayload::product($product->fresh()),
            'movement' => CatalogPayload::movement($movement),
        ]);
    }

    public function restock(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $validated = $request->validate([
            'entries' => ['required', 'array', 'min:1', 'max:100'],
            'entries.*.productId' => ['required', 'integer', 'distinct', Rule::exists('products', 'id')->where('business_id', $business->getKey())],
            'entries.*.quantity' => ['required', 'integer', 'min:1', 'max:2147483647'],
            'entries.*.supplierRef' => ['nullable', 'string', 'max:120'],
            'entries.*.note' => ['nullable', 'string', 'max:1000'],
        ]);
        $lines = array_map(fn (array $entry): array => [
            'product_id' => $entry['productId'],
            'quantity' => $entry['quantity'],
            'supplier_ref' => isset($entry['supplierRef']) ? trim($entry['supplierRef']) : null,
            'note' => isset($entry['note']) ? trim($entry['note']) : null,
        ], $validated['entries']);
        $movements = $this->inventory->restock($business, $request->user(), $request, $lines);

        return response()->json(['movements' => array_map(fn (InventoryMovement $movement) => CatalogPayload::movement($movement), $movements)]);
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
