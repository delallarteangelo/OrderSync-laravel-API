<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[Fillable(['business_id', 'order_id', 'product_id', 'sku', 'product_name', 'unit_price_minor', 'quantity', 'line_total_minor'])]
class OrderLine extends Model
{
    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Order lines are immutable.'));
        static::deleting(fn () => throw new LogicException('Order lines are immutable.'));
    }

    protected function casts(): array
    {
        return [
            'unit_price_minor' => 'integer',
            'quantity' => 'integer',
            'line_total_minor' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
