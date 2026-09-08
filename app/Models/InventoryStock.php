<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'product_id', 'quantity', 'version'])]
class InventoryStock extends Model
{
    protected $attributes = ['quantity' => 0, 'version' => 0];

    protected function casts(): array
    {
        return ['quantity' => 'integer', 'version' => 'integer'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
