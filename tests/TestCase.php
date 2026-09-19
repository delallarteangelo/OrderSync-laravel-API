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
        $expectedDatabase = match ($connection) {
            'mysql', 'mariadb' => 'ordersync_mysql_test',
            default => 'ordersync_test',
        };

        if (app()->environment('testing') && $database !== $expectedDatabase) {
            throw new RuntimeException(
                "Automated tests on {$connection} must use the isolated {$expectedDatabase} database; resolved {$database}.",
            );
        }
    }
}
