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
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('timezone')->default('Asia/Manila');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->index();
            $table->string('platform_role')->nullable()->index();
        });

        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['business_id', 'user_id']);
            $table->index(['user_id', 'is_active']);
        });

        Schema::create('access_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->char('token_hash', 64)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestampTz('expires_at')->index();
            $table->timestampTz('last_used_at')->nullable();
            $table->timestampTz('revoked_at')->nullable()->index();
            $table->string('client_name', 64)->nullable();
            $table->timestampsTz();
        });

        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->char('token_hash', 64)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->nullable()->constrained()->cascadeOnDelete();
            $table->uuid('replaced_by_id')->nullable()->index();
            $table->timestampTz('expires_at')->index();
            $table->timestampTz('revoked_at')->nullable()->index();
            $table->string('client_name', 64)->nullable();
            $table->timestampsTz();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('business_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100)->index();
            $table->string('subject_type')->nullable();
            $table->string('subject_id')->nullable();
            DatabaseDialect::isPostgreSql()
                ? $table->jsonb('metadata')->nullable()
                : $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestampTz('created_at')->useCurrent()->index();
            $table->index(['business_id', 'created_at']);
            $table->index(['subject_type', 'subject_id']);
        });

        DB::statement("ALTER TABLE users ADD CONSTRAINT users_platform_role_check CHECK (platform_role IS NULL OR platform_role = 'SUPER_ADMIN')");
        DB::statement("ALTER TABLE memberships ADD CONSTRAINT memberships_role_check CHECK (role IN ('BUSINESS_OWNER', 'STAFF', 'CASHIER', 'CUSTOMER'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('refresh_tokens');
        Schema::dropIfExists('access_tokens');
        Schema::dropIfExists('memberships');

        DatabaseDialect::dropCheckConstraint('users', 'users_platform_role_check', ifExists: true);
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'platform_role']);
        });

        Schema::dropIfExists('businesses');
    }
};
