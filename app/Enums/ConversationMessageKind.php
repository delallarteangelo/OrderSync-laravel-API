<?php

namespace App\Enums;

enum ConversationMessageKind: string
{
    case Human = 'HUMAN';
    case System = 'SYSTEM';
    case Ai = 'AI';
}
