<?php

namespace App\Models;

use App\Enums\BillingStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['business_id', 'subscription_id', 'amount_minor', 'currency', 'status', 'period_start', 'period_end', 'due_at', 'paid_at', 'reference', 'notes'])]
class BillingRecord extends Model
{
    protected function casts(): array
    {
        return [
            'amount_minor' => 'integer',
            'status' => BillingStatus::class,
            'period_start' => 'immutable_datetime',
            'period_end' => 'immutable_datetime',
            'due_at' => 'immutable_datetime',
            'paid_at' => 'immutable_datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(RecordedPayment::class);
    }
}
