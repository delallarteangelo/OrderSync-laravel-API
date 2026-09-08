<?php

namespace App\Enums;

enum ReorderAlertStatus: string
{
    case Open = 'OPEN';
    case Resolved = 'RESOLVED';
}
