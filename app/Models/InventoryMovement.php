<?php

namespace App\Models;

use App\Enums\InventoryReason;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[Fillable(['business_id', 'product_id', 'actor_user_id', 'delta', 'quantity_before', 'quantity_after', 'reason', 'note', 'supplier_ref'])]
class InventoryMovement extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'delta' => 'integer',
            'quantity_before' => 'integer',
            'quantity_after' => 'integer',
            'reason' => InventoryReason::class,
            'created_at' => 'immutable_datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Inventory movements are immutable.'));
        static::deleting(fn () => throw new LogicException('Inventory movements are immutable.'));
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
