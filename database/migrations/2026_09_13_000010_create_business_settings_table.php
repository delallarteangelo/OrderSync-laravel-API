<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('address', 500)->default('');
            $table->string('phone', 50)->default('');
            $table->string('email')->default('');
            $table->unsignedInteger('tax_rate_basis_points')->default(0);
            // TEXT defaults are supplied by BusinessSetting so the schema remains
            // compatible with PostgreSQL, MySQL, and MariaDB.
            $table->text('receipt_header');
            $table->text('receipt_footer');
            $table->unsignedInteger('low_stock_default')->default(0);
            $table->timestamps();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('business_name')->nullable();
            $table->text('receipt_header')->nullable();
            $table->text('receipt_footer')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['business_name', 'receipt_header', 'receipt_footer']);
        });
        Schema::dropIfExists('business_settings');
    }
};
