<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if (app()->environment('testing') && $database !== 'ordersync_test') {
            throw new RuntimeException(
                "Automated tests must use the isolated ordersync_test database; resolved {$database}.",
            );
        }
    }
}
