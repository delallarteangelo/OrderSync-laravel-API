<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'CASH';
    case GCash = 'GCASH';
    case Maya = 'MAYA';
    case Card = 'CARD';
    case Other = 'OTHER';
}
