<?php

namespace App\Models;

use App\Enums\ReorderAlertStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'product_id', 'status', 'threshold', 'observed_quantity', 'opened_at', 'resolved_at'])]
class ReorderAlert extends Model
{
    protected function casts(): array
    {
        return [
            'status' => ReorderAlertStatus::class,
            'threshold' => 'integer',
            'observed_quantity' => 'integer',
            'opened_at' => 'immutable_datetime',
            'resolved_at' => 'immutable_datetime',
        ];
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
