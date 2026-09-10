<?php

namespace App\Models;

use App\Enums\BusinessStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['name', 'slug', 'timezone', 'status', 'submitted_at', 'approved_at', 'suspended_at', 'suspension_reason'])]
class Business extends Model
{
    use HasFactory;

    protected $attributes = [
        'status' => 'ACTIVE',
        'timezone' => 'Asia/Manila',
    ];

    protected function casts(): array
    {
        return [
            'status' => BusinessStatus::class,
            'submitted_at' => 'immutable_datetime',
            'approved_at' => 'immutable_datetime',
            'suspended_at' => 'immutable_datetime',
        ];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function billingRecords(): HasMany
    {
        return $this->hasMany(BillingRecord::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function paymentInstructions(): HasMany
    {
        return $this->hasMany(PaymentInstruction::class);
    }

    public function recordedPayments(): HasMany
    {
        return $this->hasMany(RecordedPayment::class);
    }

    public function conversationThreads(): HasMany
    {
        return $this->hasMany(ConversationThread::class);
    }
}
