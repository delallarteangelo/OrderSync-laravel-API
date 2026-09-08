<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use App\Services\CatalogInventoryService;
use App\Services\CatalogPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function __construct(private readonly CatalogInventoryService $inventory) {}

    public function index(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'categoryId' => ['nullable', 'integer'],
            'active' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $products = Product::query()->where('business_id', $business->getKey())
            ->with(['category', 'stock', 'primaryImage'])
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $term = '%'.mb_strtolower(trim($search)).'%';
                $query->where(fn ($inner) => $inner->whereRaw('LOWER(name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(sku) LIKE ?', [$term])->orWhereRaw('LOWER(barcode) LIKE ?', [$term]));
            })
            ->when($validated['categoryId'] ?? null, fn ($query, int $categoryId) => $query->where('category_id', $categoryId))
            ->when(array_key_exists('active', $validated), fn ($query) => $query->where('is_active', $validated['active']))
            ->orderBy('name')->paginate(100);

        return response()->json([
            'items' => $products->getCollection()->map(fn (Product $product) => CatalogPayload::product($product))->all(),
            'meta' => ['currentPage' => $products->currentPage(), 'lastPage' => $products->lastPage(), 'total' => $products->total()],
        ]);
    }

    public function byBarcode(Request $request, string $code): JsonResponse
    {
        $product = Product::query()->where('business_id', $this->business($request)->getKey())
            ->where(fn ($query) => $query->where('barcode', trim($code))->orWhere('sku', mb_strtoupper(trim($code))))
            ->with(['category', 'stock', 'primaryImage'])->firstOrFail();

        return response()->json(CatalogPayload::product($product));
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->ensureTenantProduct($product, $this->business($request));

        return response()->json(CatalogPayload::product($product));
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $validated = $this->validateProduct($request, $business);
        $product = $this->inventory->createProduct($business, $request->user(), $request, $this->attributes($validated, true));

        return response()->json(CatalogPayload::product($product), 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $business = $this->business($request);
        $this->ensureTenantProduct($product, $business);
        $validated = $this->validateProduct($request, $business, $product);
        $product = $this->inventory->updateProduct($product, $request->user(), $request, $this->attributes($validated));

        return response()->json(CatalogPayload::product($product));
    }

    public function deactivate(Request $request, Product $product): JsonResponse
    {
        return $this->setActive($request, $product, false);
    }

    public function reactivate(Request $request, Product $product): JsonResponse
    {
        return $this->setActive($request, $product, true);
    }

    private function setActive(Request $request, Product $product, bool $active): JsonResponse
    {
        $this->ensureTenantProduct($product, $this->business($request));
        $product = $this->inventory->setProductActive($product, $request->user(), $request, $active);

        return response()->json(CatalogPayload::product($product));
    }

    /** @return array<string, mixed> */
    private function validateProduct(Request $request, Business $business, ?Product $product = null): array
    {
        if ($request->has('sku')) {
            $request->merge(['sku' => mb_strtoupper(trim((string) $request->input('sku')))]);
        }
        if ($request->has('name')) {
            $request->merge(['name' => trim((string) $request->input('name'))]);
        }
        if ($request->has('barcode')) {
            $request->merge(['barcode' => blank($request->input('barcode')) ? null : trim((string) $request->input('barcode'))]);
        }
        $sometimes = $product ? 'sometimes' : 'required';

        return $request->validate([
            'sku' => [$sometimes, 'string', 'max:100', Rule::unique('products')->where('business_id', $business->getKey())->ignore($product)],
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products')->where('business_id', $business->getKey())->ignore($product)],
            'name' => [$sometimes, 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'categoryId' => [$sometimes, 'integer', Rule::exists('categories', 'id')->where('business_id', $business->getKey())],
            'price' => [$sometimes, 'numeric', 'min:0', 'max:99999999.99'],
            'costPrice' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'stockOnHand' => [$product ? 'prohibited' : 'nullable', 'integer', 'min:0'],
            'lowStockThreshold' => ['sometimes', 'integer', 'min:0', 'max:4294967295'],
            'isActive' => ['sometimes', 'boolean'],
        ]);
    }

    /** @param array<string, mixed> $validated @return array<string, mixed> */
    private function attributes(array $validated, bool $includeStock = false): array
    {
        $map = ['name' => 'name', 'description' => 'description', 'categoryId' => 'category_id', 'lowStockThreshold' => 'low_stock_threshold', 'isActive' => 'is_active'];
        $attributes = [];
        foreach ($map as $input => $column) {
            if (array_key_exists($input, $validated)) {
                $attributes[$column] = is_string($validated[$input]) ? trim($validated[$input]) : $validated[$input];
            }
        }
        if (array_key_exists('sku', $validated)) {
            $attributes['sku'] = mb_strtoupper(trim($validated['sku']));
        }
        if (array_key_exists('barcode', $validated)) {
            $attributes['barcode'] = blank($validated['barcode']) ? null : trim($validated['barcode']);
        }
        if (array_key_exists('price', $validated)) {
            $attributes['price_minor'] = (int) round(((float) $validated['price']) * 100);
        }
        if (array_key_exists('costPrice', $validated)) {
            $attributes['cost_minor'] = $validated['costPrice'] === null ? null : (int) round(((float) $validated['costPrice']) * 100);
        }
        if ($includeStock) {
            $attributes['stock_on_hand'] = (int) ($validated['stockOnHand'] ?? 0);
        }

        return $attributes;
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }

    private function ensureTenantProduct(Product $product, Business $business): void
    {
        abort_unless($product->business_id === $business->getKey(), 404);
    }
}
