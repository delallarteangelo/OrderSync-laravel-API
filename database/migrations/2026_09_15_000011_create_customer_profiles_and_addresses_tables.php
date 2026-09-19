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
        Schema::create('customer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('phone', 50)->default('');
            $table->string('avatar_path')->nullable();
            $table->timestamps();
        });

        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label', 50);
            $table->string('line1', 255);
            $table->string('line2', 255)->default('');
            $table->string('city', 150);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
            if (! DatabaseDialect::isPostgreSql()) {
                $table->unsignedBigInteger('default_user_id')->nullable();
                $table->unique('default_user_id', 'customer_addresses_one_default_per_user');
            }
        });

        if (DatabaseDialect::isPostgreSql()) {
            DB::statement('CREATE UNIQUE INDEX customer_addresses_one_default_per_user ON customer_addresses (user_id) WHERE is_default = true');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_addresses');
        Schema::dropIfExists('customer_profiles');
    }
};
