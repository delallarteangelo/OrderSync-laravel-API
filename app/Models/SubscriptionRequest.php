<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['business_id', 'requested_by_user_id', 'kind', 'status', 'desired_plan_id', 'from_plan_id', 'plan_price_minor', 'from_price_minor', 'amount_due_minor', 'period_end_snapshot', 'quote_expires_at', 'application_token_hash', 'application_token_expires_at', 'reviewed_by_user_id', 'reviewed_at', 'rejection_reason', 'completed_at'])]
class SubscriptionRequest extends Model
{
    protected function casts(): array
    {
        return [
            'plan_price_minor' => 'integer',
            'from_price_minor' => 'integer',
            'amount_due_minor' => 'integer',
            'period_end_snapshot' => 'immutable_datetime',
            'quote_expires_at' => 'immutable_datetime',
            'application_token_expires_at' => 'immutable_datetime',
            'reviewed_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
        ];
    }

    public function business(): BelongsTo { return $this->belongsTo(Business::class); }
    public function requester(): BelongsTo { return $this->belongsTo(User::class, 'requested_by_user_id'); }
    public function desiredPlan(): BelongsTo { return $this->belongsTo(SubscriptionPlan::class, 'desired_plan_id'); }
    public function fromPlan(): BelongsTo { return $this->belongsTo(SubscriptionPlan::class, 'from_plan_id'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewed_by_user_id'); }
    public function bill(): HasOne { return $this->hasOne(BillingRecord::class, 'subscription_request_id'); }
}
