<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'assistant_enabled', 'daily_customer_request_limit', 'monthly_business_request_limit', 'maximum_question_characters', 'updated_by_user_id'])]
class AiSupportSetting extends Model
{
    protected $attributes = [
        'assistant_enabled' => true,
        'daily_customer_request_limit' => 20,
        'monthly_business_request_limit' => 500,
        'maximum_question_characters' => 1000,
    ];

    protected function casts(): array
    {
        return [
            'assistant_enabled' => 'boolean',
            'daily_customer_request_limit' => 'integer',
            'monthly_business_request_limit' => 'integer',
            'maximum_question_characters' => 'integer',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
