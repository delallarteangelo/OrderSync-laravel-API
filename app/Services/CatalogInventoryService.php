<?php

namespace App\Services;

use App\Enums\InventoryReason;
use App\Enums\ReorderAlertStatus;
use App\Exceptions\InsufficientStockException;
use App\Models\Business;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\ReorderAlert;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CatalogInventoryService
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** @param array<string, mixed> $attributes */
    public function createProduct(Business $business, User $actor, Request $request, array $attributes): Product
    {
        return DB::transaction(function () use ($business, $actor, $request, $attributes): Product {
            $initialStock = (int) ($attributes['stock_on_hand'] ?? 0);
            unset($attributes['stock_on_hand']);
            $product = $business->products()->create($attributes);
            $stock = $product->stock()->create([
                'business_id' => $business->getKey(),
                'quantity' => $initialStock,
                'version' => $initialStock > 0 ? 1 : 0,
            ]);

            if ($initialStock > 0) {
                $this->recordMovement($product, $stock, $actor, $initialStock, 0, InventoryReason::Adjustment, 'Initial stock', null);
            }
            $this->syncReorderAlert($product, $initialStock);
            $this->audit->record('product.created', $request, $actor, $business, Product::class, $product->getKey(), [
                'sku' => $product->sku,
                'initial_stock' => $initialStock,
            ]);

            return $product->fresh(['category', 'stock', 'primaryImage']);
        });
    }

    /** @param array<string, mixed> $attributes */
    public function updateProduct(Product $product, User $actor, Request $request, array $attributes): Product
    {
        return DB::transaction(function () use ($product, $actor, $request, $attributes): Product {
            $locked = Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
            $locked->update($attributes);
            $stock = $locked->stock()->firstOrFail();
            $this->syncReorderAlert($locked, $stock->quantity);
            $this->audit->record('product.updated', $request, $actor, $locked->business, Product::class, $locked->getKey(), [
                'sku' => $locked->sku,
            ]);

            return $locked->fresh(['category', 'stock', 'primaryImage']);
        });
    }

    public function setProductActive(Product $product, User $actor, Request $request, bool $active): Product
    {
        return DB::transaction(function () use ($product, $actor, $request, $active): Product {
            $locked = Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
            $locked->update(['is_active' => $active]);
            $this->syncReorderAlert($locked, $locked->stock()->value('quantity') ?? 0);
            $this->audit->record($active ? 'product.reactivated' : 'product.deactivated', $request, $actor, $locked->business, Product::class, $locked->getKey());

            return $locked->fresh(['category', 'stock', 'primaryImage']);
        });
    }

    public function adjust(Product $product, User $actor, Request $request, int $delta, string $note): InventoryMovement
    {
        return DB::transaction(function () use ($product, $actor, $request, $delta, $note): InventoryMovement {
            $stock = InventoryStock::query()->where('business_id', $product->business_id)
                ->where('product_id', $product->getKey())->lockForUpdate()->firstOrFail();
            $movement = $this->applyStockChange($product, $stock, $actor, $delta, InventoryReason::Adjustment, $note, null);
            $this->audit->record('inventory.adjusted', $request, $actor, $product->business, Product::class, $product->getKey(), [
                'delta' => $delta,
                'quantity_after' => $movement->quantity_after,
            ]);

            return $movement;
        });
    }

    /** @param array<int, array{product_id:int, quantity:int, supplier_ref:?string, note:?string}> $lines */
    public function restock(Business $business, User $actor, Request $request, array $lines): array
    {
        return DB::transaction(function () use ($business, $actor, $request, $lines): array {
            usort($lines, fn (array $left, array $right): int => $left['product_id'] <=> $right['product_id']);
            $movements = [];
            foreach ($lines as $line) {
                $product = Product::query()->where('business_id', $business->getKey())
                    ->whereKey($line['product_id'])->lockForUpdate()->firstOrFail();
                $stock = InventoryStock::query()->where('business_id', $business->getKey())
                    ->where('product_id', $product->getKey())->lockForUpdate()->firstOrFail();
                $movements[] = $this->applyStockChange(
                    $product,
                    $stock,
                    $actor,
                    $line['quantity'],
                    InventoryReason::Restock,
                    $line['note'],
                    $line['supplier_ref'],
                );
            }
            $this->audit->record('inventory.restocked', $request, $actor, $business, Business::class, $business->getKey(), [
                'line_count' => count($lines),
                'total_quantity' => array_sum(array_column($lines, 'quantity')),
            ]);

            return $movements;
        });
    }

    private function applyStockChange(
        Product $product,
        InventoryStock $stock,
        User $actor,
        int $delta,
        InventoryReason $reason,
        ?string $note,
        ?string $supplierRef,
    ): InventoryMovement {
        $before = $stock->quantity;
        $after = $before + $delta;
        if ($after < 0) {
            throw new InsufficientStockException;
        }
        $stock->update(['quantity' => $after, 'version' => $stock->version + 1]);
        $movement = $this->recordMovement($product, $stock, $actor, $delta, $before, $reason, $note, $supplierRef);
        $this->syncReorderAlert($product, $after);

        return $movement;
    }

    private function recordMovement(
        Product $product,
        InventoryStock $stock,
        User $actor,
        int $delta,
        int $before,
        InventoryReason $reason,
        ?string $note,
        ?string $supplierRef,
    ): InventoryMovement {
        return $product->movements()->create([
            'business_id' => $product->business_id,
            'actor_user_id' => $actor->getKey(),
            'delta' => $delta,
            'quantity_before' => $before,
            'quantity_after' => $stock->quantity,
            'reason' => $reason,
            'note' => $note,
            'supplier_ref' => $supplierRef,
        ]);
    }

    private function syncReorderAlert(Product $product, int $quantity): void
    {
        $alert = ReorderAlert::query()->where('business_id', $product->business_id)
            ->where('product_id', $product->getKey())->first();

        if ($product->is_active && $quantity <= $product->low_stock_threshold) {
            $reopening = ! $alert || $alert->status === ReorderAlertStatus::Resolved;
            ReorderAlert::query()->updateOrCreate(
                ['business_id' => $product->business_id, 'product_id' => $product->getKey()],
                [
                    'status' => ReorderAlertStatus::Open,
                    'threshold' => $product->low_stock_threshold,
                    'observed_quantity' => $quantity,
                    'opened_at' => $reopening ? now() : $alert->opened_at,
                    'resolved_at' => null,
                ],
            );

            return;
        }

        if ($alert && $alert->status === ReorderAlertStatus::Open) {
            $alert->update([
                'status' => ReorderAlertStatus::Resolved,
                'threshold' => $product->low_stock_threshold,
                'observed_quantity' => $quantity,
                'resolved_at' => now(),
            ]);
        }
    }
}
