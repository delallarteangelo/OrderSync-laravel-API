<?php

namespace App\Models;

use App\Enums\UserNotificationType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'user_id', 'type', 'title', 'body', 'resource_type', 'resource_id', 'read_at', 'created_at'])]
class UserNotification extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['type' => UserNotificationType::class, 'read_at' => 'immutable_datetime', 'created_at' => 'immutable_datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
