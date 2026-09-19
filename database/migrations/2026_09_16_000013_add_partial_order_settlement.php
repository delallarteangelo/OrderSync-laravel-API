<?php

use App\Support\Database\DatabaseDialect;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('balance_collection_method', 30)->default('CASH_AT_PICKUP');
        });
        Schema::table('recorded_payments', function (Blueprint $table): void {
            $table->unsignedBigInteger('verified_amount_minor')->nullable();
        });
        // Previously verified order receipts represented the full recorded amount.
        DB::table('recorded_payments')->where('context', 'CUSTOMER_ORDER')->where('status', 'VERIFIED')
            ->update(['verified_amount_minor' => DB::raw('amount_minor')]);

        Schema::create('order_counter_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('received_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('amount_minor');
            $table->string('reference_number', 120);
            $table->timestampTz('received_at');
            $table->timestampsTz();
            $table->unique(['business_id', 'reference_number']);
        });
        Schema::create('order_refunds', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('refunded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('amount_minor');
            $table->string('method', 20);
            $table->string('reference_number', 120);
            $table->timestampTz('refunded_at');
            $table->timestampsTz();
            $table->index(['order_id', 'refunded_at']);
            $table->unique(['business_id', 'method', 'reference_number']);
        });
        DatabaseDialect::dropCheckConstraint('orders', 'orders_status_check');
        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'))");
        DatabaseDialect::dropCheckConstraint('order_status_events', 'order_status_events_status_check');
        DB::statement("ALTER TABLE order_status_events ADD CONSTRAINT order_status_events_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'))");
        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_balance_collection_check CHECK (balance_collection_method IN ('CASH_AT_PICKUP', 'WALLET_TOPUP'))");
        DB::statement('ALTER TABLE recorded_payments ADD CONSTRAINT recorded_payments_verified_amount_check CHECK (verified_amount_minor IS NULL OR (status = \'VERIFIED\' AND context = \'CUSTOMER_ORDER\' AND verified_amount_minor > 0))');
        DB::statement('ALTER TABLE order_counter_payments ADD CONSTRAINT order_counter_payments_amount_check CHECK (amount_minor > 0)');
        DB::statement("ALTER TABLE order_refunds ADD CONSTRAINT order_refunds_check CHECK (amount_minor > 0 AND method IN ('GCASH', 'MAYA', 'CASH'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('order_refunds');
        Schema::dropIfExists('order_counter_payments');
        DatabaseDialect::dropCheckConstraint('recorded_payments', 'recorded_payments_verified_amount_check');
        DatabaseDialect::dropCheckConstraint('orders', 'orders_balance_collection_check');
        Schema::table('recorded_payments', fn (Blueprint $table) => $table->dropColumn('verified_amount_minor'));
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn('balance_collection_method'));
        DatabaseDialect::dropCheckConstraint('orders', 'orders_status_check');
        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'))");
        DatabaseDialect::dropCheckConstraint('order_status_events', 'order_status_events_status_check');
        DB::statement("ALTER TABLE order_status_events ADD CONSTRAINT order_status_events_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'))");
    }
};
