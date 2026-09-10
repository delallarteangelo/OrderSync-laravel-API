<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use LogicException;

#[Fillable(['business_id', 'user_id', 'type', 'resource_type', 'resource_id', 'data', 'occurred_at'])]
class RealtimeEvent extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['data' => 'array', 'occurred_at' => 'immutable_datetime'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Realtime events are immutable.'));
        static::deleting(fn () => throw new LogicException('Realtime events are immutable.'));
    }
}
