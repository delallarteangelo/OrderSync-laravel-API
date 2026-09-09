<?php

namespace App\Models;

use App\Enums\RecordedPaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class PaymentReviewEvent extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['status' => RecordedPaymentStatus::class, 'created_at' => 'immutable_datetime'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Payment review events are immutable.'));
        static::deleting(fn () => throw new LogicException('Payment review events are immutable.'));
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(RecordedPayment::class, 'recorded_payment_id');
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
