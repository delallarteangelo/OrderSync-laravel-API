<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BusinessStatus;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class StorefrontController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Business::query()
            ->where('status', BusinessStatus::Active)
            ->with('subscription.plan.entitlements')
            ->orderBy('name')
            ->get()
            ->filter(fn (Business $business): bool => $this->orderingEnabled($business))
            ->map(fn (Business $business): array => $this->businessPayload($business))
            ->values()
            ->all();

        return response()->json(['items' => $items]);
    }

    public function show(string $slug): JsonResponse
    {
        $business = Business::query()
            ->where('slug', $slug)
            ->where('status', BusinessStatus::Active)
            ->with(['subscription.plan.entitlements', 'categories' => fn ($query) => $query->where('is_active', true)->orderBy('name')])
            ->firstOrFail();
        abort_unless($this->orderingEnabled($business), 404);

        $products = Product::query()
            ->where('business_id', $business->getKey())
            ->where('is_active', true)
            ->whereHas('category', fn ($query) => $query->where('is_active', true))
            ->with(['category', 'stock', 'primaryImage'])
            ->orderBy('name')
            ->get()
            ->map(function (Product $product): array {
                $image = $product->primaryImage;

                return [
                    'id' => (string) $product->getKey(),
                    'name' => $product->name,
                    'description' => $product->description,
                    'categoryId' => (string) $product->category_id,
                    'categoryName' => $product->category->name,
                    'price' => $product->price_minor / 100,
                    'stockOnHand' => $product->stock?->quantity ?? 0,
                    'imageUrl' => $image ? Storage::disk($image->disk)->url($image->path) : null,
                ];
            })->all();

        return response()->json([
            'business' => $this->businessPayload($business),
            'categories' => $business->categories->map(fn ($category): array => [
                'id' => (string) $category->getKey(),
                'name' => $category->name,
            ])->all(),
            'products' => $products,
        ]);
    }

    private function orderingEnabled(Business $business): bool
    {
        $subscription = $business->subscription;
        if (! $subscription || ! in_array($subscription->effectiveStatus(), [SubscriptionStatus::Active, SubscriptionStatus::Grace], true)) {
            return false;
        }
        $entitlement = $subscription->plan->entitlements->firstWhere('key', 'customer_ordering_enabled');

        return $entitlement?->pivot->value === 'true';
    }

    /** @return array<string, string> */
    private function businessPayload(Business $business): array
    {
        return [
            'id' => (string) $business->getKey(),
            'name' => $business->name,
            'slug' => $business->slug,
            'timezone' => $business->timezone,
            'fulfillmentMethod' => 'PICKUP',
        ];
    }
}
