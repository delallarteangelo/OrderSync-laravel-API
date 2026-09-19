<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['method', 'account_name', 'account_number', 'is_active', 'updated_by_user_id'])]
class PlatformWallet extends Model
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
