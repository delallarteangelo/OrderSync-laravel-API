<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'method', 'account_name', 'account_number', 'instructions', 'qr_disk', 'qr_path', 'qr_mime_type', 'qr_size_bytes', 'is_active'])]
class PaymentInstruction extends Model
{
    protected function casts(): array
    {
        return [
            'method' => PaymentMethod::class,
            'qr_size_bytes' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
