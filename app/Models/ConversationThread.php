<?php

namespace App\Models;

use App\Enums\ConversationKind;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['business_id', 'customer_user_id', 'general_customer_user_id', 'order_id', 'kind', 'customer_name', 'customer_email', 'last_message_at'])]
class ConversationThread extends Model
{
    protected function casts(): array
    {
        return ['kind' => ConversationKind::class, 'last_message_at' => 'immutable_datetime'];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_user_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ConversationMessage::class);
    }

    public function readStates(): HasMany
    {
        return $this->hasMany(ConversationReadState::class);
    }

    public function aiSupportRuns(): HasMany
    {
        return $this->hasMany(AiSupportRun::class);
    }

    public function supportHandoffs(): HasMany
    {
        return $this->hasMany(SupportHandoff::class);
    }
}
