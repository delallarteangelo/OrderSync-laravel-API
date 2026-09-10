<?php

namespace App\Enums;

enum SupportHandoffStatus: string
{
    case Open = 'OPEN';
    case Resolved = 'RESOLVED';
}
