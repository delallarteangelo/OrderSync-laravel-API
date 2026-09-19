<?php

namespace App\Models;

use App\Enums\SupportHandoffStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'conversation_thread_id', 'customer_user_id', 'ai_support_run_id', 'status', 'reason_code', 'customer_note', 'requested_at', 'resolved_at', 'resolved_by_user_id', 'open_thread_id'])]
class SupportHandoff extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'status' => SupportHandoffStatus::class,
            'requested_at' => 'immutable_datetime',
            'resolved_at' => 'immutable_datetime',
        ];
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

    public function run(): BelongsTo
    {
        return $this->belongsTo(AiSupportRun::class, 'ai_support_run_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }
}
