<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['business_id', 'address', 'phone', 'email', 'tax_rate_basis_points', 'receipt_header', 'receipt_footer', 'low_stock_default'])]
class BusinessSetting extends Model
{
    protected $attributes = [
        'address' => '',
        'phone' => '',
        'email' => '',
        'tax_rate_basis_points' => 0,
        'receipt_header' => '',
        'receipt_footer' => 'Thank you for shopping!',
        'low_stock_default' => 0,
    ];

    protected function casts(): array
    {
        return [
            'tax_rate_basis_points' => 'integer',
            'low_stock_default' => 'integer',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
