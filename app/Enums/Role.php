<?php

namespace App\Enums;

enum Role: string
{
    case SuperAdmin = 'SUPER_ADMIN';
    case BusinessOwner = 'BUSINESS_OWNER';
    case Staff = 'STAFF';
    case Cashier = 'CASHIER';
    case Customer = 'CUSTOMER';

    public function isPlatformRole(): bool
    {
        return $this === self::SuperAdmin;
    }

    public function canManageBusiness(): bool
    {
        return in_array($this, [self::SuperAdmin, self::BusinessOwner], true);
    }
}
