<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'conversation_thread_id', 'user_id', 'last_read_message_id', 'read_at'])]
class ConversationReadState extends Model
{
    protected function casts(): array
    {
        return ['read_at' => 'immutable_datetime'];
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(ConversationThread::class, 'conversation_thread_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lastReadMessage(): BelongsTo
    {
        return $this->belongsTo(ConversationMessage::class, 'last_read_message_id');
    }
}
