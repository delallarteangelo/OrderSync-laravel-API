<?php

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['business_id', 'subscription_plan_id', 'status', 'starts_at', 'current_period_start', 'current_period_end', 'grace_ends_at', 'cancelled_at'])]
class Subscription extends Model
{
    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'starts_at' => 'immutable_datetime',
            'current_period_start' => 'immutable_datetime',
            'current_period_end' => 'immutable_datetime',
            'grace_ends_at' => 'immutable_datetime',
            'cancelled_at' => 'immutable_datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function billingRecords(): HasMany
    {
        return $this->hasMany(BillingRecord::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(SubscriptionEvent::class);
    }

    public function effectiveStatus(): SubscriptionStatus
    {
        if ($this->status === SubscriptionStatus::Cancelled) {
            return SubscriptionStatus::Cancelled;
        }

        if ($this->current_period_end->isFuture()) {
            return SubscriptionStatus::Active;
        }

        if ($this->grace_ends_at?->isFuture()) {
            return SubscriptionStatus::Grace;
        }

        return SubscriptionStatus::Expired;
    }
}
