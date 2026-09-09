<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('order_number', 80);
            $table->string('status', 30)->default('PENDING');
            $table->string('fulfillment_method', 20)->default('PICKUP');
            $table->unsignedBigInteger('subtotal_minor');
            $table->unsignedBigInteger('total_minor');
            $table->string('idempotency_key', 120);
            $table->char('request_fingerprint', 64);
            $table->timestampTz('placed_at')->useCurrent();
            $table->timestampTz('confirmed_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampsTz();
            $table->unique(['business_id', 'order_number']);
            $table->unique(['business_id', 'customer_user_id', 'idempotency_key']);
            $table->index(['business_id', 'status', 'placed_at']);
            $table->index(['business_id', 'customer_user_id', 'placed_at']);
        });

        Schema::create('order_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('sku', 100);
            $table->string('product_name');
            $table->unsignedBigInteger('unit_price_minor');
            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('line_total_minor');
            $table->timestampsTz();
            $table->index(['business_id', 'product_id']);
        });

        Schema::create('order_status_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30);
            $table->string('actor_name');
            $table->text('note')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->index(['business_id', 'order_id', 'created_at']);
        });

        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'))");
        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_fulfillment_check CHECK (fulfillment_method = 'PICKUP')");
        DB::statement('ALTER TABLE orders ADD CONSTRAINT orders_totals_check CHECK (subtotal_minor = total_minor)');
        DB::statement('ALTER TABLE order_lines ADD CONSTRAINT order_lines_quantity_check CHECK (quantity > 0)');
        DB::statement('ALTER TABLE order_lines ADD CONSTRAINT order_lines_total_check CHECK (line_total_minor = unit_price_minor * quantity)');
        DB::statement("ALTER TABLE order_status_events ADD CONSTRAINT order_status_events_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('order_status_events');
        Schema::dropIfExists('order_lines');
        Schema::dropIfExists('orders');
    }
};
