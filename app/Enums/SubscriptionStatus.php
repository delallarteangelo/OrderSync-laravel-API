<?php

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Active = 'ACTIVE';
    case Grace = 'GRACE';
    case Expired = 'EXPIRED';
    case Cancelled = 'CANCELLED';
}
