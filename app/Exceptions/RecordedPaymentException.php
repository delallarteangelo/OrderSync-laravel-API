<?php

namespace App\Exceptions;

use DomainException;

class RecordedPaymentException extends DomainException
{
    /** @param array<string, array<int, string>> $fieldErrors */
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $status = 409,
        public readonly array $fieldErrors = [],
    ) {
        parent::__construct($message);
    }
}
