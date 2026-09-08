<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Entitlement extends Model
{
    protected $guarded = ['id'];

    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(SubscriptionPlan::class, 'plan_entitlements')
            ->withPivot('value')
            ->withTimestamps();
    }
}
