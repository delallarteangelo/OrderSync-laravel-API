<?php

namespace App\Services;

use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ReorderAlert;
use Illuminate\Support\Facades\Storage;

class CatalogPayload
{
    /** @return array<string, mixed> */
    public static function category(Category $category): array
    {
        $payload = [
            'id' => (string) $category->getKey(),
            'name' => $category->name,
            'iconUrl' => $category->icon_path ? Storage::disk('public')->url($category->icon_path) : null,
            'isActive' => $category->is_active,
        ];

        if ($category->relationLoaded('products')) {
            $payload['productCount'] = $category->products->count();
        }

        return $payload;
    }

    /** @return array<string, mixed> */
    public static function product(Product $product): array
    {
        $product->loadMissing(['category', 'stock', 'primaryImage']);
        $image = $product->primaryImage;

        return [
            'id' => (string) $product->getKey(),
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'name' => $product->name,
            'description' => $product->description,
            'categoryId' => (string) $product->category_id,
            'categoryName' => $product->category->name,
            'price' => $product->price_minor / 100,
            'costPrice' => $product->cost_minor === null ? null : $product->cost_minor / 100,
            'stockOnHand' => $product->stock?->quantity ?? 0,
            'stockVersion' => $product->stock?->version ?? 0,
            'lowStockThreshold' => $product->low_stock_threshold,
            'isActive' => $product->is_active,
            'imageUrl' => $image ? Storage::disk($image->disk)->url($image->path) : null,
            'createdAt' => $product->created_at?->toIso8601String(),
            'updatedAt' => $product->updated_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public static function movement(InventoryMovement $movement): array
    {
        $movement->loadMissing(['product', 'actor']);

        return [
            'id' => (string) $movement->getKey(),
            'productId' => (string) $movement->product_id,
            'productName' => $movement->product->name,
            'delta' => $movement->delta,
            'quantityBefore' => $movement->quantity_before,
            'quantityAfter' => $movement->quantity_after,
            'reason' => $movement->reason->value,
            'note' => $movement->note,
            'supplierRef' => $movement->supplier_ref,
            'actorId' => $movement->actor ? (string) $movement->actor->getKey() : null,
            'actorName' => $movement->actor?->name ?? 'System',
            'occurredAt' => $movement->created_at->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public static function alert(ReorderAlert $alert): array
    {
        $alert->loadMissing('product.stock');

        return [
            'id' => (string) $alert->getKey(),
            'productId' => (string) $alert->product_id,
            'productName' => $alert->product->name,
            'sku' => $alert->product->sku,
            'stockOnHand' => $alert->product->stock?->quantity ?? $alert->observed_quantity,
            'threshold' => $alert->threshold,
            'status' => $alert->status->value,
            'openedAt' => $alert->opened_at->toIso8601String(),
        ];
    }
}
