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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('icon_path')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestampsTz();
            $table->index(['business_id', 'is_active']);
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('sku', 100);
            $table->string('barcode', 100)->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('price_minor');
            $table->unsignedBigInteger('cost_minor')->nullable();
            $table->unsignedInteger('low_stock_threshold')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestampsTz();
            $table->unique(['business_id', 'sku']);
            $table->unique(['business_id', 'barcode']);
            $table->index(['business_id', 'category_id', 'is_active']);
            $table->index(['business_id', 'name']);
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('disk', 40)->default('public');
            $table->string('path');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->boolean('is_primary')->default(true);
            $table->timestampsTz();
            $table->index(['business_id', 'product_id']);
        });

        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->unique()->constrained()->cascadeOnDelete();
            $table->bigInteger('quantity')->default(0);
            $table->unsignedBigInteger('version')->default(0);
            $table->timestampsTz();
            $table->index(['business_id', 'quantity']);
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->bigInteger('delta');
            $table->bigInteger('quantity_before');
            $table->bigInteger('quantity_after');
            $table->string('reason', 40)->index();
            $table->text('note')->nullable();
            $table->string('supplier_ref', 120)->nullable();
            $table->timestampTz('created_at')->useCurrent()->index();
            $table->index(['business_id', 'created_at']);
            $table->index(['business_id', 'product_id', 'created_at']);
        });

        Schema::create('reorder_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('OPEN')->index();
            $table->unsignedInteger('threshold');
            $table->bigInteger('observed_quantity');
            $table->timestampTz('opened_at');
            $table->timestampTz('resolved_at')->nullable();
            $table->timestampsTz();
            $table->index(['business_id', 'status']);
        });

        if (DatabaseDialect::isPostgreSql()) {
            DB::statement('CREATE UNIQUE INDEX categories_business_name_unique ON categories (business_id, LOWER(name))');
        } else {
            Schema::table('categories', function (Blueprint $table): void {
                // Hostinger's utf8mb4_unicode_ci collation makes this unique key case-insensitive.
                $table->unique(['business_id', 'name'], 'categories_business_name_unique');
            });
        }
        DB::statement("ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_reason_check CHECK (reason IN ('ADJUSTMENT', 'RESTOCK', 'POS_SALE', 'ORDER_CONFIRMED'))");
        DB::statement('ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_delta_check CHECK (delta <> 0)');
        DB::statement('ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_quantity_check CHECK (quantity_before >= 0 AND quantity_after >= 0 AND quantity_after = quantity_before + delta)');
        DB::statement('ALTER TABLE inventory_stocks ADD CONSTRAINT inventory_stocks_quantity_check CHECK (quantity >= 0)');
        DB::statement("ALTER TABLE reorder_alerts ADD CONSTRAINT reorder_alerts_status_check CHECK (status IN ('OPEN', 'RESOLVED'))");
        DB::statement('ALTER TABLE reorder_alerts ADD CONSTRAINT reorder_alerts_quantity_check CHECK (observed_quantity >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('reorder_alerts');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventory_stocks');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
