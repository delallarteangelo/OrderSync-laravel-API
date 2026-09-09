<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_instructions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('method', 20);
            $table->string('account_name');
            $table->string('account_number', 120);
            $table->text('instructions')->nullable();
            $table->string('qr_disk', 40)->nullable();
            $table->string('qr_path')->nullable();
            $table->string('qr_mime_type', 100)->nullable();
            $table->unsignedBigInteger('qr_size_bytes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
            $table->unique(['business_id', 'method']);
        });

        Schema::create('recorded_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('context', 30);
            $table->foreignId('order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('billing_record_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('method', 20);
            $table->string('reference_number', 120);
            $table->unsignedBigInteger('amount_minor');
            $table->string('currency', 3)->default('PHP');
            $table->string('status', 20)->default('SUBMITTED');
            $table->string('proof_disk', 40)->default('local');
            $table->string('proof_path')->nullable();
            $table->string('proof_mime_type', 100);
            $table->unsignedBigInteger('proof_size_bytes');
            $table->char('proof_sha256', 64);
            $table->boolean('duplicate_reference')->default(false);
            $table->boolean('duplicate_proof')->default(false);
            $table->foreignId('duplicate_of_payment_id')->nullable()->constrained('recorded_payments')->nullOnDelete();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->string('receipt_number', 100)->nullable();
            $table->timestampTz('submitted_at')->useCurrent();
            $table->timestampTz('reviewed_at')->nullable();
            $table->timestampTz('retained_until');
            $table->timestampTz('proof_deleted_at')->nullable();
            $table->timestampsTz();
            $table->unique(['business_id', 'receipt_number']);
            $table->index(['business_id', 'context', 'status', 'submitted_at']);
            $table->index(['business_id', 'method', 'reference_number']);
            $table->index(['business_id', 'proof_sha256']);
            $table->index(['retained_until', 'proof_deleted_at']);
        });

        Schema::create('payment_review_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recorded_payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20);
            $table->string('actor_name');
            $table->text('note')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->index(['business_id', 'recorded_payment_id', 'created_at']);
        });

        DB::statement("ALTER TABLE payment_instructions ADD CONSTRAINT payment_instructions_method_check CHECK (method IN ('GCASH', 'MAYA'))");
        DB::statement('ALTER TABLE payment_instructions ADD CONSTRAINT payment_instructions_qr_check CHECK ((qr_path IS NULL AND qr_disk IS NULL AND qr_mime_type IS NULL AND qr_size_bytes IS NULL) OR (qr_path IS NOT NULL AND qr_disk IS NOT NULL AND qr_mime_type IS NOT NULL AND qr_size_bytes > 0))');
        DB::statement("ALTER TABLE recorded_payments ADD CONSTRAINT recorded_payments_context_check CHECK (context IN ('CUSTOMER_ORDER', 'SUBSCRIPTION'))");
        DB::statement("ALTER TABLE recorded_payments ADD CONSTRAINT recorded_payments_parent_check CHECK ((context = 'CUSTOMER_ORDER' AND order_id IS NOT NULL AND billing_record_id IS NULL) OR (context = 'SUBSCRIPTION' AND order_id IS NULL AND billing_record_id IS NOT NULL))");
        DB::statement("ALTER TABLE recorded_payments ADD CONSTRAINT recorded_payments_method_check CHECK (method IN ('GCASH', 'MAYA'))");
        DB::statement("ALTER TABLE recorded_payments ADD CONSTRAINT recorded_payments_status_check CHECK (status IN ('SUBMITTED', 'VERIFIED', 'REJECTED'))");
        DB::statement("ALTER TABLE recorded_payments ADD CONSTRAINT recorded_payments_amount_check CHECK (amount_minor > 0 AND currency = 'PHP')");
        DB::statement("ALTER TABLE recorded_payments ADD CONSTRAINT recorded_payments_review_check CHECK ((status = 'SUBMITTED' AND reviewed_at IS NULL AND receipt_number IS NULL AND rejection_reason IS NULL) OR (status = 'VERIFIED' AND reviewed_at IS NOT NULL AND receipt_number IS NOT NULL AND rejection_reason IS NULL) OR (status = 'REJECTED' AND reviewed_at IS NOT NULL AND receipt_number IS NULL AND rejection_reason IS NOT NULL))");
        DB::statement("ALTER TABLE payment_review_events ADD CONSTRAINT payment_review_events_status_check CHECK (status IN ('SUBMITTED', 'VERIFIED', 'REJECTED'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_review_events');
        Schema::dropIfExists('recorded_payments');
        Schema::dropIfExists('payment_instructions');
    }
};
