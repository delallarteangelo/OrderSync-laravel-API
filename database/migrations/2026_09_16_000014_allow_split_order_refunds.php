<?php

use App\Support\Database\DatabaseDialect;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DatabaseDialect::isPostgreSql()) {
            DB::statement('ALTER TABLE order_refunds DROP CONSTRAINT IF EXISTS order_refunds_order_id_unique');
            DB::statement('DROP INDEX IF EXISTS order_refunds_order_id_unique');
            DB::statement('CREATE INDEX IF NOT EXISTS order_refunds_order_id_refunded_at_index ON order_refunds (order_id, refunded_at)');
        }
    }

    public function down(): void
    {
        if (DatabaseDialect::isPostgreSql()) {
            DB::statement('DROP INDEX IF EXISTS order_refunds_order_id_refunded_at_index');
        }
    }
};
