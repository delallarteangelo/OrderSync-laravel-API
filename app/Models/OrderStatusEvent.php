<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[Fillable(['business_id', 'order_id', 'actor_user_id', 'status', 'actor_name', 'note'])]
class OrderStatusEvent extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['status' => OrderStatus::class, 'created_at' => 'immutable_datetime'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Order status history is immutable.'));
        static::deleting(fn () => throw new LogicException('Order status history is immutable.'));
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
