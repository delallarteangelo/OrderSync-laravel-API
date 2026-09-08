<?php

namespace App\Enums;

enum BillingStatus: string
{
    case Pending = 'PENDING';
    case Paid = 'PAID';
    case Overdue = 'OVERDUE';
    case Void = 'VOID';
}
