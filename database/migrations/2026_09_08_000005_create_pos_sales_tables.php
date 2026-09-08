<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cashier_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('cashier_name');
            $table->string('sale_number', 80);
            $table->string('receipt_number', 80);
            $table->string('status', 20)->default('COMPLETED');
            $table->unsignedBigInteger('subtotal_minor');
            $table->unsignedBigInteger('discount_total_minor')->default(0);
            $table->unsignedBigInteger('tax_total_minor')->default(0);
            $table->unsignedBigInteger('grand_total_minor');
            $table->unsignedInteger('tax_rate_basis_points')->default(0);
            $table->string('payment_method', 20);
            $table->unsignedBigInteger('tendered_minor')->nullable();
            $table->unsignedBigInteger('change_minor')->nullable();
            $table->string('payment_reference', 120)->nullable();
            $table->string('idempotency_key', 120);
            $table->char('request_fingerprint', 64);
            $table->timestampTz('completed_at')->useCurrent();
            $table->timestampsTz();
            $table->unique(['business_id', 'sale_number']);
            $table->unique(['business_id', 'receipt_number']);
            $table->unique(['business_id', 'idempotency_key']);
            $table->index(['business_id', 'completed_at']);
            $table->index(['business_id', 'payment_method', 'completed_at']);
        });

        Schema::create('sale_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('sku', 100);
            $table->string('product_name');
            $table->unsignedBigInteger('unit_price_minor');
            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('line_discount_minor')->default(0);
            $table->unsignedBigInteger('line_total_minor');
            $table->timestampsTz();
            $table->index(['business_id', 'product_id']);
        });

        DB::statement("ALTER TABLE sales ADD CONSTRAINT sales_status_check CHECK (status = 'COMPLETED')");
        DB::statement("ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check CHECK (payment_method IN ('CASH', 'GCASH', 'MAYA', 'CARD', 'OTHER'))");
        DB::statement('ALTER TABLE sales ADD CONSTRAINT sales_totals_check CHECK (grand_total_minor = subtotal_minor - discount_total_minor + tax_total_minor AND discount_total_minor <= subtotal_minor)');
        DB::statement("ALTER TABLE sales ADD CONSTRAINT sales_payment_amounts_check CHECK ((payment_method = 'CASH' AND tendered_minor IS NOT NULL AND tendered_minor >= grand_total_minor AND change_minor = tendered_minor - grand_total_minor AND payment_reference IS NULL) OR (payment_method <> 'CASH' AND tendered_minor IS NULL AND change_minor IS NULL AND payment_reference IS NOT NULL))");
        DB::statement('ALTER TABLE sale_lines ADD CONSTRAINT sale_lines_quantity_check CHECK (quantity > 0)');
        DB::statement('ALTER TABLE sale_lines ADD CONSTRAINT sale_lines_total_check CHECK (line_discount_minor <= unit_price_minor * quantity AND line_total_minor = unit_price_minor * quantity - line_discount_minor)');
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_lines');
        Schema::dropIfExists('sales');
    }
};
