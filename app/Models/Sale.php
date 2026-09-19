<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use LogicException;

#[Fillable(['business_id', 'business_name', 'receipt_header', 'receipt_footer', 'cashier_user_id', 'cashier_name', 'sale_number', 'receipt_number', 'status', 'subtotal_minor', 'discount_total_minor', 'tax_total_minor', 'grand_total_minor', 'tax_rate_basis_points', 'payment_method', 'tendered_minor', 'change_minor', 'payment_reference', 'idempotency_key', 'request_fingerprint', 'completed_at'])]
class Sale extends Model
{
    protected function casts(): array
    {
        return [
            'subtotal_minor' => 'integer',
            'discount_total_minor' => 'integer',
            'tax_total_minor' => 'integer',
            'grand_total_minor' => 'integer',
            'tax_rate_basis_points' => 'integer',
            'payment_method' => PaymentMethod::class,
            'tendered_minor' => 'integer',
            'change_minor' => 'integer',
            'completed_at' => 'immutable_datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Completed sales are immutable.'));
        static::deleting(fn () => throw new LogicException('Completed sales are immutable.'));
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_user_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SaleLine::class);
    }
}
