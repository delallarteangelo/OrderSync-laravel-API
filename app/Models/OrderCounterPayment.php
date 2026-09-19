<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'order_id', 'received_by_user_id', 'amount_minor', 'reference_number', 'received_at'])]
class OrderCounterPayment extends Model
{
    protected function casts(): array
    {
        return ['amount_minor' => 'integer', 'received_at' => 'immutable_datetime'];
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_user_id');
    }
}
