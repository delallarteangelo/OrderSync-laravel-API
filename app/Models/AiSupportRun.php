<?php

namespace App\Models;

use App\Enums\AiSupportRunStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[Fillable(['business_id', 'conversation_thread_id', 'customer_user_id', 'question_message_id', 'response_message_id', 'status', 'provider', 'model', 'tools_used', 'input_characters', 'output_characters', 'estimated_cost_minor', 'latency_ms', 'reason_code', 'created_at'])]
class AiSupportRun extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'status' => AiSupportRunStatus::class,
            'tools_used' => 'array',
            'input_characters' => 'integer',
            'output_characters' => 'integer',
            'estimated_cost_minor' => 'integer',
            'latency_ms' => 'integer',
            'created_at' => 'immutable_datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('AI support runs are immutable.'));
        static::deleting(fn () => throw new LogicException('AI support runs are immutable.'));
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(ConversationThread::class, 'conversation_thread_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_user_id');
    }

    public function questionMessage(): BelongsTo
    {
        return $this->belongsTo(ConversationMessage::class, 'question_message_id');
    }

    public function responseMessage(): BelongsTo
    {
        return $this->belongsTo(ConversationMessage::class, 'response_message_id');
    }
}
