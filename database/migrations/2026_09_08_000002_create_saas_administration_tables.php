<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name');
            $table->unsignedBigInteger('price_minor')->nullable();
            $table->char('currency', 3)->default('PHP');
            $table->string('billing_interval', 20)->default('MONTHLY');
            $table->unsignedSmallInteger('grace_days')->default(7);
            $table->boolean('is_active')->default(true)->index();
            $table->timestampsTz();
        });

        Schema::create('entitlements', function (Blueprint $table) {
            $table->id();
            $table->string('key', 80)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('value_type', 20);
            $table->timestampsTz();
        });

        Schema::create('plan_entitlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entitlement_id')->constrained()->cascadeOnDelete();
            $table->string('value', 255);
            $table->timestampsTz();
            $table->unique(['subscription_plan_id', 'entitlement_id']);
        });

        Schema::table('businesses', function (Blueprint $table) {
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestampTz('submitted_at')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->timestampTz('suspended_at')->nullable();
            $table->text('suspension_reason')->nullable();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->constrained();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestampTz('starts_at');
            $table->timestampTz('current_period_start');
            $table->timestampTz('current_period_end')->index();
            $table->timestampTz('grace_ends_at')->nullable()->index();
            $table->timestampTz('cancelled_at')->nullable();
            $table->timestampsTz();
        });

        Schema::create('billing_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount_minor');
            $table->char('currency', 3)->default('PHP');
            $table->string('status', 20)->default('PENDING')->index();
            $table->timestampTz('period_start');
            $table->timestampTz('period_end');
            $table->timestampTz('due_at')->index();
            $table->timestampTz('paid_at')->nullable();
            $table->string('reference', 120)->nullable();
            $table->text('notes')->nullable();
            $table->timestampsTz();
            $table->index(['business_id', 'created_at']);
        });

        Schema::create('subscription_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type', 80)->index();
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20)->nullable();
            $table->string('from_plan_code', 32)->nullable();
            $table->string('to_plan_code', 32)->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampTz('created_at')->useCurrent()->index();
            $table->index(['business_id', 'created_at']);
        });

        DB::statement("ALTER TABLE businesses ADD CONSTRAINT businesses_status_check CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED'))");
        DB::statement("ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_code_check CHECK (code IN ('BASIC', 'STANDARD', 'PREMIUM'))");
        DB::statement("ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_interval_check CHECK (billing_interval = 'MONTHLY')");
        DB::statement("ALTER TABLE entitlements ADD CONSTRAINT entitlements_value_type_check CHECK (value_type IN ('BOOLEAN', 'INTEGER', 'STRING'))");
        DB::statement("ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('ACTIVE', 'GRACE', 'EXPIRED', 'CANCELLED'))");
        DB::statement("ALTER TABLE billing_records ADD CONSTRAINT billing_records_status_check CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'VOID'))");
        DB::statement('ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_period_check CHECK (current_period_end > current_period_start)');
        DB::statement('ALTER TABLE billing_records ADD CONSTRAINT billing_records_period_check CHECK (period_end > period_start)');

        $now = now();
        DB::table('subscription_plans')->insert([
            ['code' => 'BASIC', 'name' => 'Basic', 'currency' => 'PHP', 'billing_interval' => 'MONTHLY', 'grace_days' => 7, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'STANDARD', 'name' => 'Standard', 'currency' => 'PHP', 'billing_interval' => 'MONTHLY', 'grace_days' => 7, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'PREMIUM', 'name' => 'Premium', 'currency' => 'PHP', 'billing_interval' => 'MONTHLY', 'grace_days' => 7, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        $definitions = [
            ['key' => 'max_users', 'name' => 'Maximum users', 'value_type' => 'INTEGER'],
            ['key' => 'catalog_enabled', 'name' => 'Catalog', 'value_type' => 'BOOLEAN'],
            ['key' => 'inventory_enabled', 'name' => 'Inventory', 'value_type' => 'BOOLEAN'],
            ['key' => 'pos_enabled', 'name' => 'Point of sale', 'value_type' => 'BOOLEAN'],
            ['key' => 'customer_ordering_enabled', 'name' => 'Customer ordering', 'value_type' => 'BOOLEAN'],
            ['key' => 'messaging_enabled', 'name' => 'Messaging', 'value_type' => 'BOOLEAN'],
            ['key' => 'analytics_enabled', 'name' => 'Analytics', 'value_type' => 'BOOLEAN'],
            ['key' => 'ai_support_enabled', 'name' => 'AI support', 'value_type' => 'BOOLEAN'],
        ];
        DB::table('entitlements')->insert(array_map(
            fn (array $definition): array => [...$definition, 'created_at' => $now, 'updated_at' => $now],
            $definitions,
        ));

        $matrix = [
            'BASIC' => ['max_users' => '2', 'catalog_enabled' => 'true', 'inventory_enabled' => 'true', 'pos_enabled' => 'true', 'customer_ordering_enabled' => 'false', 'messaging_enabled' => 'false', 'analytics_enabled' => 'false', 'ai_support_enabled' => 'false'],
            'STANDARD' => ['max_users' => '10', 'catalog_enabled' => 'true', 'inventory_enabled' => 'true', 'pos_enabled' => 'true', 'customer_ordering_enabled' => 'true', 'messaging_enabled' => 'true', 'analytics_enabled' => 'true', 'ai_support_enabled' => 'false'],
            'PREMIUM' => ['max_users' => '50', 'catalog_enabled' => 'true', 'inventory_enabled' => 'true', 'pos_enabled' => 'true', 'customer_ordering_enabled' => 'true', 'messaging_enabled' => 'true', 'analytics_enabled' => 'true', 'ai_support_enabled' => 'true'],
        ];
        $plans = DB::table('subscription_plans')->pluck('id', 'code');
        $entitlements = DB::table('entitlements')->pluck('id', 'key');
        $rows = [];
        foreach ($matrix as $planCode => $values) {
            foreach ($values as $key => $value) {
                $rows[] = [
                    'subscription_plan_id' => $plans[$planCode],
                    'entitlement_id' => $entitlements[$key],
                    'value' => $value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        DB::table('plan_entitlements')->insert($rows);
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_events');
        Schema::dropIfExists('billing_records');
        Schema::dropIfExists('subscriptions');

        DB::statement('ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_status_check');
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['status', 'submitted_at', 'approved_at', 'suspended_at', 'suspension_reason']);
        });

        Schema::dropIfExists('plan_entitlements');
        Schema::dropIfExists('entitlements');
        Schema::dropIfExists('subscription_plans');
    }
};
