<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'order_id', 'refunded_by_user_id', 'amount_minor', 'method', 'reference_number', 'refunded_at'])]
class OrderRefund extends Model
{
    protected function casts(): array
    {
        return ['amount_minor' => 'integer', 'refunded_at' => 'immutable_datetime'];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by_user_id');
    }
}
