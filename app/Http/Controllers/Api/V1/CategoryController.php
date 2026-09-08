<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Category;
use App\Services\AuditLogger;
use App\Services\CatalogPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $categories = Category::query()->where('business_id', $business->getKey())
            ->withCount('products')->orderBy('name')->get();

        return response()->json([
            'items' => $categories->map(fn (Category $category): array => [
                ...CatalogPayload::category($category),
                'productCount' => $category->products_count,
            ])->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $request->merge(['name' => trim((string) $request->input('name'))]);
        $validated = $request->validate(['name' => ['required', 'string', 'max:255']]);
        $name = trim($validated['name']);
        $this->ensureUniqueName($business, $name);
        $category = $business->categories()->create(['name' => $name]);
        $this->audit->record('category.created', $request, $request->user(), $business, Category::class, $category->getKey(), ['name' => $name]);

        return response()->json(CatalogPayload::category($category), 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $business = $this->business($request);
        $this->ensureTenantCategory($category, $business);
        if ($request->has('name')) {
            $request->merge(['name' => trim((string) $request->input('name'))]);
        }
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'isActive' => ['sometimes', 'boolean'],
        ]);
        $updates = [];
        if (array_key_exists('name', $validated)) {
            $updates['name'] = trim($validated['name']);
            $this->ensureUniqueName($business, $updates['name'], $category);
        }
        if (array_key_exists('isActive', $validated)) {
            $updates['is_active'] = $validated['isActive'];
        }
        $category->update($updates);
        $this->audit->record('category.updated', $request, $request->user(), $business, Category::class, $category->getKey(), ['name' => $category->name]);

        return response()->json(CatalogPayload::category($category->fresh()));
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $business = $this->business($request);
        $this->ensureTenantCategory($category, $business);
        if ($category->products()->exists()) {
            return response()->json(['code' => 'CATEGORY_IN_USE', 'message' => 'Category is in use by one or more products.'], 409);
        }
        $id = $category->getKey();
        $name = $category->name;
        $category->delete();
        $this->audit->record('category.deleted', $request, $request->user(), $business, Category::class, $id, ['name' => $name]);

        return response()->json(null, 204);
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }

    private function ensureTenantCategory(Category $category, Business $business): void
    {
        abort_unless($category->business_id === $business->getKey(), 404);
    }

    private function ensureUniqueName(Business $business, string $name, ?Category $except = null): void
    {
        $exists = Category::query()->where('business_id', $business->getKey())
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
            ->when($except, fn ($query) => $query->whereKeyNot($except->getKey()))->exists();
        if ($exists) {
            throw ValidationException::withMessages(['name' => ['A category with this name already exists.']]);
        }
    }
}
