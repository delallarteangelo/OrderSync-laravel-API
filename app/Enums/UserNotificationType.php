<?php

namespace App\Enums;

enum UserNotificationType: string
{
    case Message = 'MESSAGE';
    case Order = 'ORDER';
    case Payment = 'PAYMENT';
    case System = 'SYSTEM';

    public function preferenceColumn(): ?string
    {
        return match ($this) {
            self::Message => 'messages_enabled',
            self::Order => 'orders_enabled',
            self::Payment => 'payments_enabled',
            self::System => null,
        };
    }
}
