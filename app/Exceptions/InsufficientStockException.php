<?php

namespace App\Exceptions;

use RuntimeException;

class InsufficientStockException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('The inventory adjustment would make stock negative.');
    }
}
