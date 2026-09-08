<?php

namespace Tests\Unit;

use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_audit_records_cannot_be_updated_or_deleted_through_the_model(): void
    {
        $log = AuditLog::create(['action' => 'test.created']);

        $this->expectException(LogicException::class);
        $log->update(['action' => 'test.changed']);
    }

    public function test_audit_records_cannot_be_deleted_through_the_model(): void
    {
        $log = AuditLog::create(['action' => 'test.created']);

        $this->expectException(LogicException::class);
        $log->delete();
    }
}
