<?php

namespace App\Enums;

enum AiSupportRunStatus: string
{
    case Answered = 'ANSWERED';
    case Handoff = 'HANDOFF';
    case Refused = 'REFUSED';
    case Limited = 'LIMITED';
    case Unavailable = 'UNAVAILABLE';
}
