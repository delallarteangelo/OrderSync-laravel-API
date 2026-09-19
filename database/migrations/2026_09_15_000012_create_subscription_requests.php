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
        Schema::create('platform_wallets', function (Blueprint $table): void {
            $table->id();
            $table->string('method', 16)->unique();
            $table->string('account_name', 120);
            $table->string('account_number', 40);
            $table->boolean('is_active')->default(false);
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
        });

        Schema::create('subscription_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by_user_id')->constrained('users');
            $table->string('kind', 16);
            $table->string('status', 24)->index();
            $table->foreignId('desired_plan_id')->constrained('subscription_plans');
            $table->foreignId('from_plan_id')->nullable()->constrained('subscription_plans');
            $table->unsignedBigInteger('plan_price_minor')->nullable();
            $table->unsignedBigInteger('from_price_minor')->nullable();
            $table->unsignedBigInteger('amount_due_minor')->nullable();
            $table->timestampTz('period_end_snapshot')->nullable();
            $table->timestampTz('quote_expires_at')->nullable();
            $table->string('application_token_hash', 64)->nullable();
            $table->timestampTz('application_token_expires_at')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampsTz();
            $table->index(['business_id', 'status']);
        });

        Schema::table('billing_records', function (Blueprint $table): void {
            $table->foreignId('subscription_request_id')->nullable()->unique()->constrained('subscription_requests')->nullOnDelete();
        });
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->unsignedBigInteger('period_price_minor')->nullable();
        });

        DatabaseDialect::dropCheckConstraint('businesses', 'businesses_status_check');
        DB::statement("ALTER TABLE businesses ADD CONSTRAINT businesses_status_check CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'))");
        DB::statement("ALTER TABLE platform_wallets ADD CONSTRAINT platform_wallets_method_check CHECK (method IN ('GCASH', 'MAYA'))");
        DB::statement("ALTER TABLE subscription_requests ADD CONSTRAINT subscription_requests_kind_check CHECK (kind IN ('INITIAL', 'UPGRADE'))");
        DB::statement("ALTER TABLE subscription_requests ADD CONSTRAINT subscription_requests_status_check CHECK (status IN ('PENDING_REVIEW', 'AWAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'))");

        // Editable launch prices, applied only where a Super Admin has not set a price.
        foreach (['BASIC' => 0, 'STANDARD' => 19_900, 'PREMIUM' => 39_900] as $code => $priceMinor) {
            DB::table('subscription_plans')->where('code', $code)->whereNull('price_minor')
                ->update(['price_minor' => $priceMinor, 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        DatabaseDialect::dropCheckConstraint('businesses', 'businesses_status_check');
        DB::statement("ALTER TABLE businesses ADD CONSTRAINT businesses_status_check CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED'))");
        Schema::table('subscriptions', fn (Blueprint $table) => $table->dropColumn('period_price_minor'));
        Schema::table('billing_records', fn (Blueprint $table) => $table->dropConstrainedForeignId('subscription_request_id'));
        Schema::dropIfExists('subscription_requests');
        Schema::dropIfExists('platform_wallets');
    }
};
