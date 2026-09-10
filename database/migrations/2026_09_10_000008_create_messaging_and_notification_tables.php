<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversation_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('kind', 20);
            $table->string('customer_name');
            $table->string('customer_email');
            $table->timestampTz('last_message_at')->nullable();
            $table->timestampsTz();
            $table->index(['business_id', 'last_message_at']);
            $table->index(['business_id', 'customer_user_id']);
        });

        Schema::create('conversation_messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_thread_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_role', 30);
            $table->string('kind', 20);
            $table->text('body');
            $table->timestampTz('sent_at')->useCurrent();
            $table->timestampTz('created_at')->useCurrent();
            $table->index(['business_id', 'conversation_thread_id', 'id']);
        });

        Schema::create('conversation_read_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_thread_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('last_read_message_id')->nullable()->constrained('conversation_messages')->nullOnDelete();
            $table->timestampTz('read_at');
            $table->timestampsTz();
            $table->unique(['conversation_thread_id', 'user_id']);
            $table->index(['business_id', 'user_id']);
        });

        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('messages_enabled')->default(true);
            $table->boolean('orders_enabled')->default(true);
            $table->boolean('payments_enabled')->default(true);
            $table->timestampsTz();
            $table->unique(['business_id', 'user_id']);
        });

        Schema::create('user_notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('title');
            $table->text('body');
            $table->string('resource_type', 50)->nullable();
            $table->string('resource_id')->nullable();
            $table->timestampTz('read_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->index(['business_id', 'user_id', 'read_at', 'id']);
        });

        Schema::create('realtime_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->string('resource_type', 50)->nullable();
            $table->string('resource_id')->nullable();
            $table->jsonb('data')->nullable();
            $table->timestampTz('occurred_at')->useCurrent();
            $table->index(['business_id', 'user_id', 'id']);
        });

        DB::statement("ALTER TABLE conversation_threads ADD CONSTRAINT conversation_threads_kind_check CHECK (kind IN ('GENERAL', 'ORDER'))");
        DB::statement("ALTER TABLE conversation_threads ADD CONSTRAINT conversation_threads_parent_check CHECK ((kind = 'GENERAL' AND order_id IS NULL) OR (kind = 'ORDER' AND order_id IS NOT NULL))");
        DB::statement("CREATE UNIQUE INDEX conversation_threads_general_unique ON conversation_threads (business_id, customer_user_id) WHERE kind = 'GENERAL' AND customer_user_id IS NOT NULL");
        DB::statement("CREATE UNIQUE INDEX conversation_threads_order_unique ON conversation_threads (business_id, order_id) WHERE kind = 'ORDER'");
        DB::statement("ALTER TABLE conversation_messages ADD CONSTRAINT conversation_messages_kind_check CHECK (kind IN ('HUMAN', 'SYSTEM'))");
        DB::statement("ALTER TABLE conversation_messages ADD CONSTRAINT conversation_messages_role_check CHECK (sender_role IN ('BUSINESS_OWNER', 'STAFF', 'CASHIER', 'CUSTOMER', 'SYSTEM'))");
        DB::statement("ALTER TABLE conversation_messages ADD CONSTRAINT conversation_messages_sender_check CHECK ((kind = 'SYSTEM' AND sender_user_id IS NULL AND sender_role = 'SYSTEM') OR (kind = 'HUMAN' AND sender_user_id IS NOT NULL AND sender_role <> 'SYSTEM'))");
        DB::statement('ALTER TABLE conversation_messages ADD CONSTRAINT conversation_messages_body_check CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000)');
        DB::statement("ALTER TABLE user_notifications ADD CONSTRAINT user_notifications_type_check CHECK (type IN ('MESSAGE', 'ORDER', 'PAYMENT', 'SYSTEM'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('realtime_events');
        Schema::dropIfExists('user_notifications');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('conversation_read_states');
        Schema::dropIfExists('conversation_messages');
        Schema::dropIfExists('conversation_threads');
    }
};
