<?php

namespace App\Enums;

enum RecordedPaymentContext: string
{
    case CustomerOrder = 'CUSTOMER_ORDER';
    case Subscription = 'SUBSCRIPTION';
}
