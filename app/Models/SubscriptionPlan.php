<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'price_minor', 'currency', 'grace_days', 'is_active'])]
class SubscriptionPlan extends Model
{
    protected function casts(): array
    {
        return [
            'price_minor' => 'integer',
            'grace_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function entitlements(): BelongsToMany
    {
        return $this->belongsToMany(Entitlement::class, 'plan_entitlements')
            ->withPivot('value')
            ->withTimestamps();
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
