<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_knowledge_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('title', 200);
            $table->text('question')->nullable();
            $table->text('content');
            $table->jsonb('keywords')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('published_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['business_id', 'type', 'is_active']);
        });

        Schema::create('ai_support_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('assistant_enabled')->default(true);
            $table->unsignedSmallInteger('daily_customer_request_limit')->default(20);
            $table->unsignedInteger('monthly_business_request_limit')->default(500);
            $table->unsignedSmallInteger('maximum_question_characters')->default(1000);
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
        });

        Schema::create('ai_support_runs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_thread_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('question_message_id')->nullable()->constrained('conversation_messages')->nullOnDelete();
            $table->foreignId('response_message_id')->nullable()->constrained('conversation_messages')->nullOnDelete();
            $table->string('status', 20);
            $table->string('provider', 50);
            $table->string('model', 100)->nullable();
            $table->jsonb('tools_used')->nullable();
            $table->unsignedInteger('input_characters')->default(0);
            $table->unsignedInteger('output_characters')->default(0);
            $table->unsignedBigInteger('estimated_cost_minor')->default(0);
            $table->unsignedInteger('latency_ms')->default(0);
            $table->string('reason_code', 60)->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->index(['business_id', 'created_at']);
            $table->index(['business_id', 'customer_user_id', 'created_at']);
        });

        Schema::create('support_handoffs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_thread_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('ai_support_run_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 20)->default('OPEN');
            $table->string('reason_code', 60);
            $table->text('customer_note')->nullable();
            $table->timestampTz('requested_at')->useCurrent();
            $table->timestampTz('resolved_at')->nullable();
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->index(['business_id', 'status', 'requested_at']);
        });

        DB::statement("ALTER TABLE ai_knowledge_entries ADD CONSTRAINT ai_knowledge_entries_type_check CHECK (type IN ('FAQ', 'ANNOUNCEMENT'))");
        DB::statement('ALTER TABLE ai_knowledge_entries ADD CONSTRAINT ai_knowledge_entries_title_check CHECK (char_length(btrim(title)) BETWEEN 1 AND 200)');
        DB::statement('ALTER TABLE ai_knowledge_entries ADD CONSTRAINT ai_knowledge_entries_content_check CHECK (char_length(btrim(content)) BETWEEN 1 AND 8000)');
        DB::statement("ALTER TABLE ai_support_runs ADD CONSTRAINT ai_support_runs_status_check CHECK (status IN ('ANSWERED', 'HANDOFF', 'REFUSED', 'LIMITED', 'UNAVAILABLE'))");
        DB::statement("ALTER TABLE support_handoffs ADD CONSTRAINT support_handoffs_status_check CHECK (status IN ('OPEN', 'RESOLVED'))");
        DB::statement('CREATE UNIQUE INDEX support_handoffs_one_open_per_thread ON support_handoffs (conversation_thread_id) WHERE status = \'OPEN\'');

        DB::statement('ALTER TABLE conversation_messages DROP CONSTRAINT conversation_messages_kind_check');
        DB::statement('ALTER TABLE conversation_messages DROP CONSTRAINT conversation_messages_role_check');
        DB::statement('ALTER TABLE conversation_messages DROP CONSTRAINT conversation_messages_sender_check');
        DB::statement("ALTER TABLE conversation_messages ADD CONSTRAINT conversation_messages_kind_check CHECK (kind IN ('HUMAN', 'SYSTEM', 'AI'))");
        DB::statement("ALTER TABLE conversation_messages ADD CONSTRAINT conversation_messages_role_check CHECK (sender_role IN ('BUSINESS_OWNER', 'STAFF', 'CASHIER', 'CUSTOMER', 'SYSTEM', 'AI'))");
        DB::statement("ALTER TABLE conversation_messages ADD CONSTRAINT conversation_messages_sender_check CHECK ((kind IN ('SYSTEM', 'AI') AND sender_user_id IS NULL AND sender_role = kind) OR (kind = 'HUMAN' AND sender_user_id IS NOT NULL AND sender_role NOT IN ('SYSTEM', 'AI')))");
    }

    public function down(): void
    {
        DB::table('conversation_messages')->where('kind', 'AI')->delete();
        DB::statement('ALTER TABLE conversation_messages DROP CONSTRAINT conversation_messages_sender_check');
        DB::statement('ALTER TABLE conversation_messages DROP CONSTRAINT conversation_messages_role_check');
        DB::statement('ALTER TABLE conversation_messages DROP CONSTRAINT conversation_messages_kind_check');
        DB::statement("ALTER TABLE conversation_messages ADD CONSTRAINT conversation_messages_kind_check CHECK (kind IN ('HUMAN', 'SYSTEM'))");
        DB::statement("ALTER TABLE conversation_messages ADD CONSTRAINT conversation_messages_role_check CHECK (sender_role IN ('BUSINESS_OWNER', 'STAFF', 'CASHIER', 'CUSTOMER', 'SYSTEM'))");
        DB::statement("ALTER TABLE conversation_messages ADD CONSTRAINT conversation_messages_sender_check CHECK ((kind = 'SYSTEM' AND sender_user_id IS NULL AND sender_role = 'SYSTEM') OR (kind = 'HUMAN' AND sender_user_id IS NOT NULL AND sender_role <> 'SYSTEM'))");

        Schema::dropIfExists('support_handoffs');
        Schema::dropIfExists('ai_support_runs');
        Schema::dropIfExists('ai_support_settings');
        Schema::dropIfExists('ai_knowledge_entries');
    }
};
