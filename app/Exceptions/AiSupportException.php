<?php

namespace App\Exceptions;

use DomainException;

class AiSupportException extends DomainException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $status = 409,
    ) {
        parent::__construct($message);
    }
}
