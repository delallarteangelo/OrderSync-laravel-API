<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'phone', 'avatar_path'])]
class CustomerProfile extends Model
{
    protected $attributes = ['phone' => ''];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
