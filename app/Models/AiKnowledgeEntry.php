<?php

namespace App\Models;

use App\Enums\AiKnowledgeType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'type', 'title', 'question', 'content', 'keywords', 'is_active', 'published_at', 'created_by_user_id', 'updated_by_user_id'])]
class AiKnowledgeEntry extends Model
{
    protected function casts(): array
    {
        return [
            'type' => AiKnowledgeType::class,
            'keywords' => 'array',
            'is_active' => 'boolean',
            'published_at' => 'immutable_datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
