<?php

namespace Tests\Feature\Api;

use App\Enums\BusinessStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\ConversationMessage;
use App\Models\Membership;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

class MessagingNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_human_support_threads_are_tenant_scoped_unread_and_immutable(): void
    {
        [$business, $customer, $customerToken, $owner, $ownerToken] = $this->tenant('Chat Store', 'chat-store');
        [, , , , $otherOwnerToken] = $this->tenant('Other Chat Store', 'other-chat-store');

        $threadId = $this->withToken($customerToken)->postJson('/api/v1/threads', [])
            ->assertCreated()->assertJsonPath('kind', 'GENERAL')->json('id');
        $messageId = $this->withToken($customerToken)->postJson("/api/v1/threads/{$threadId}/messages", ['body' => 'Is pickup available this afternoon?'])
            ->assertCreated()->assertJsonPath('senderRole', 'CUSTOMER')->assertJsonPath('mine', true)->json('id');

        $this->withToken($ownerToken)->getJson('/api/v1/threads')
            ->assertOk()->assertJsonPath('items.0.id', $threadId)->assertJsonPath('items.0.unreadCount', 1);
        $this->withToken($otherOwnerToken)->getJson("/api/v1/threads/{$threadId}/messages")->assertNotFound();
        $this->withToken($ownerToken)->postJson("/api/v1/threads/{$threadId}/read")->assertOk();
        $this->withToken($ownerToken)->getJson('/api/v1/threads')->assertJsonPath('items.0.unreadCount', 0);

        $this->withToken($ownerToken)->postJson("/api/v1/threads/{$threadId}/messages", ['body' => 'Yes, pickup is available until 6 PM.'])
            ->assertCreated()->assertJsonPath('senderRole', 'BUSINESS_OWNER');
        $this->withToken($customerToken)->getJson('/api/v1/threads')->assertJsonPath('items.0.unreadCount', 1);
        $this->assertDatabaseHas('audit_logs', ['business_id' => $business->getKey(), 'actor_user_id' => $owner->getKey(), 'action' => 'message.sent']);

        $this->expectException(LogicException::class);
        $message = ConversationMessage::query()->findOrFail($messageId);
        $message->update(['body' => 'Changed']);
    }

    public function test_order_activity_creates_system_thread_targeted_notifications_and_poll_events(): void
    {
        [$business, , $customerToken, , $ownerToken] = $this->tenant('Order Chat Store', 'order-chat-store');
        $product = $this->catalogProduct($business);

        $order = $this->withToken($customerToken)->withHeader('Idempotency-Key', 'phase8-order-1')->postJson('/api/v1/customer/orders', [
            'items' => [['productId' => $product->getKey(), 'quantity' => 1]],
        ])->assertCreated();
        $orderId = $order->json('id');
        $threadId = $this->withToken($customerToken)->postJson('/api/v1/threads', ['orderId' => $orderId])
            ->assertCreated()->assertJsonPath('kind', 'ORDER')->assertJsonPath('orderId', $orderId)->json('id');

        $this->withToken($ownerToken)->getJson("/api/v1/threads/{$threadId}/messages")
            ->assertOk()->assertJsonPath('items.0.kind', 'SYSTEM');
        $notificationId = $this->withToken($ownerToken)->getJson('/api/v1/notifications')
            ->assertOk()->assertJsonPath('unreadCount', 1)->assertJsonPath('items.0.type', 'ORDER')->json('items.0.id');
        $this->withToken($ownerToken)->getJson('/api/v1/events?after=0')
            ->assertOk()->assertJsonPath('transport', 'POLLING')->assertJsonPath('items.0.resourceId', $notificationId);

        $this->withToken($ownerToken)->postJson("/api/v1/notifications/{$notificationId}/read")->assertOk()->assertJsonPath('readAt', fn ($value) => is_string($value));
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$orderId}/transition", ['next' => 'CONFIRMED'])->assertOk();
        $this->withToken($customerToken)->getJson('/api/v1/notifications')
            ->assertOk()->assertJsonPath('items.0.type', 'ORDER')->assertJsonPath('unreadCount', 1);
        $this->assertDatabaseCount('conversation_threads', 1);
    }

    public function test_notification_preferences_suppress_foreground_records_without_hiding_messages(): void
    {
        [, , $customerToken, , $ownerToken] = $this->tenant('Preference Store', 'preference-store');
        $threadId = $this->withToken($customerToken)->postJson('/api/v1/threads')->assertCreated()->json('id');

        $this->withToken($customerToken)->putJson('/api/v1/notification-preferences', [
            'messagesEnabled' => false, 'ordersEnabled' => true, 'paymentsEnabled' => true,
        ])->assertOk()->assertJsonPath('messagesEnabled', false);
        $this->withToken($ownerToken)->postJson("/api/v1/threads/{$threadId}/messages", ['body' => 'Your request has been received.'])->assertCreated();
        $this->withToken($customerToken)->getJson("/api/v1/threads/{$threadId}/messages")->assertOk()->assertJsonCount(1, 'items');
        $this->withToken($customerToken)->getJson('/api/v1/notifications')->assertOk()->assertJsonPath('unreadCount', 0)->assertJsonCount(0, 'items');
        $this->withToken($customerToken)->getJson('/api/v1/events?after=0')->assertOk()->assertJsonCount(0, 'items');
        $this->assertDatabaseHas('audit_logs', ['action' => 'notification.preferences_updated']);
    }

    /** @return array{Business,User,string,User,string} */
    private function tenant(string $name, string $slug): array
    {
        $business = Business::query()->create(['name' => $name, 'slug' => $slug, 'status' => BusinessStatus::Active, 'approved_at' => now()]);
        $plan = SubscriptionPlan::query()->where('code', 'STANDARD')->firstOrFail();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(), 'status' => SubscriptionStatus::Active,
            'starts_at' => now(), 'current_period_start' => now(), 'current_period_end' => now()->addMonth(),
        ]);
        $customer = User::factory()->create();
        $owner = User::factory()->create();
        Membership::query()->create(['business_id' => $business->getKey(), 'user_id' => $customer->getKey(), 'role' => Role::Customer]);
        Membership::query()->create(['business_id' => $business->getKey(), 'user_id' => $owner->getKey(), 'role' => Role::BusinessOwner]);
        $customerToken = $this->postJson('/api/v1/auth/login', ['email' => $customer->email, 'password' => 'password', 'businessId' => $business->getKey()])->assertOk()->json('accessToken');
        $ownerToken = $this->postJson('/api/v1/auth/login', ['email' => $owner->email, 'password' => 'password', 'businessId' => $business->getKey()])->assertOk()->json('accessToken');

        return [$business, $customer, $customerToken, $owner, $ownerToken];
    }

    private function catalogProduct(Business $business)
    {
        $category = $business->categories()->create(['name' => 'Messages']);
        $product = $business->products()->create([
            'category_id' => $category->getKey(), 'sku' => 'MSG-'.$business->getKey(), 'name' => 'Messaging Product',
            'price_minor' => 1500, 'is_active' => true,
        ]);
        $product->stock()->create(['business_id' => $business->getKey(), 'quantity' => 5]);

        return $product;
    }
}
