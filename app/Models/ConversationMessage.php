<?php

namespace App\Models;

use App\Enums\ConversationMessageKind;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[Fillable(['business_id', 'conversation_thread_id', 'sender_user_id', 'sender_role', 'kind', 'body', 'sent_at'])]
class ConversationMessage extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'kind' => ConversationMessageKind::class,
            'sent_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Conversation messages are immutable.'));
        static::deleting(fn () => throw new LogicException('Conversation messages are immutable.'));
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(ConversationThread::class, 'conversation_thread_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }
}
