<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'user_id', 'messages_enabled', 'orders_enabled', 'payments_enabled'])]
class NotificationPreference extends Model
{
    protected function casts(): array
    {
        return ['messages_enabled' => 'boolean', 'orders_enabled' => 'boolean', 'payments_enabled' => 'boolean'];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
