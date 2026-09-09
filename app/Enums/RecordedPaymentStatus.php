<?php

namespace App\Enums;

enum RecordedPaymentStatus: string
{
    case Submitted = 'SUBMITTED';
    case Verified = 'VERIFIED';
    case Rejected = 'REJECTED';
}
