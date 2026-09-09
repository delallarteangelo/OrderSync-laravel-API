<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\RecordedPaymentContext;
use App\Enums\RecordedPaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['business_id', 'context', 'order_id', 'billing_record_id', 'submitted_by_user_id', 'method', 'reference_number', 'amount_minor', 'currency', 'status', 'proof_disk', 'proof_path', 'proof_mime_type', 'proof_size_bytes', 'proof_sha256', 'duplicate_reference', 'duplicate_proof', 'duplicate_of_payment_id', 'reviewed_by_user_id', 'rejection_reason', 'receipt_number', 'submitted_at', 'reviewed_at', 'retained_until', 'proof_deleted_at'])]
class RecordedPayment extends Model
{
    protected function casts(): array
    {
        return [
            'context' => RecordedPaymentContext::class,
            'method' => PaymentMethod::class,
            'status' => RecordedPaymentStatus::class,
            'amount_minor' => 'integer',
            'proof_size_bytes' => 'integer',
            'duplicate_reference' => 'boolean',
            'duplicate_proof' => 'boolean',
            'submitted_at' => 'immutable_datetime',
            'reviewed_at' => 'immutable_datetime',
            'retained_until' => 'immutable_datetime',
            'proof_deleted_at' => 'immutable_datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function billingRecord(): BelongsTo
    {
        return $this->belongsTo(BillingRecord::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function duplicateOf(): BelongsTo
    {
        return $this->belongsTo(self::class, 'duplicate_of_payment_id');
    }

    public function reviewEvents(): HasMany
    {
        return $this->hasMany(PaymentReviewEvent::class);
    }
}
