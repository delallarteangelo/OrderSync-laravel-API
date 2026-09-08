<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_reports_a_working_database(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertExactJson([
                'status' => 'ok',
                'service' => 'ordersync-api',
                'checks' => ['database' => 'ok'],
            ]);
    }

    public function test_health_endpoint_fails_without_disclosing_the_exception(): void
    {
        $database = app('db');
        DB::shouldReceive('connection')->zeroOrMoreTimes()->andReturnUsing(
            fn (?string $name = null) => $database->connection($name),
        );
        DB::shouldReceive('select')
            ->once()
            ->with('select 1')
            ->andThrow(new RuntimeException('sensitive connection detail'));

        $response = $this->getJson('/api/v1/health')
            ->assertStatus(503)
            ->assertExactJson([
                'status' => 'unavailable',
                'service' => 'ordersync-api',
                'checks' => ['database' => 'unavailable'],
            ]);

        $this->assertStringNotContainsString('sensitive', $response->getContent());
    }
}
