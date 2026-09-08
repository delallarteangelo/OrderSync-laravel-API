<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\AuditLogger;
use App\Services\CatalogPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ProductImageController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function store(Request $request, Product $product): JsonResponse
    {
        $business = $request->attributes->get('currentBusiness');
        $this->ensureTenantProduct($product, $business);
        $request->validate(['image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096']]);
        $file = $request->file('image');
        $path = $file->storeAs("product-images/{$business->getKey()}", Str::uuid().'.'.$file->extension(), 'public');
        if (! is_string($path)) {
            throw new RuntimeException('The product image could not be stored.');
        }

        $oldPaths = [];
        try {
            DB::transaction(function () use ($request, $product, $business, $file, $path, &$oldPaths): void {
                $oldPaths = $product->images()->where('is_primary', true)->pluck('path')->all();
                $product->images()->where('is_primary', true)->update(['is_primary' => false]);
                $product->images()->create([
                    'business_id' => $business->getKey(),
                    'disk' => 'public',
                    'path' => $path,
                    'mime_type' => $file->getMimeType(),
                    'size_bytes' => $file->getSize(),
                    'is_primary' => true,
                ]);
                $this->audit->record('product.image_uploaded', $request, $request->user(), $business, ProductImage::class, $product->getKey(), [
                    'product_id' => $product->getKey(),
                    'size_bytes' => $file->getSize(),
                ]);
            });
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($path);
            throw $exception;
        }
        Storage::disk('public')->delete($oldPaths);

        return response()->json(CatalogPayload::product($product->fresh()));
    }

    private function ensureTenantProduct(Product $product, Business $business): void
    {
        abort_unless($product->business_id === $business->getKey(), 404);
    }
}
