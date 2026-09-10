<?php

namespace App\Services;

use App\Enums\ConversationKind;
use App\Enums\ConversationMessageKind;
use App\Enums\Role;
use App\Enums\UserNotificationType;
use App\Models\Business;
use App\Models\ConversationMessage;
use App\Models\ConversationReadState;
use App\Models\ConversationThread;
use App\Models\NotificationPreference;
use App\Models\Order;
use App\Models\RealtimeEvent;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessagingService
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function threadForOrder(Order $order): ConversationThread
    {
        return ConversationThread::query()->firstOrCreate(
            ['business_id' => $order->business_id, 'order_id' => $order->getKey()],
            [
                'customer_user_id' => $order->customer_user_id,
                'kind' => ConversationKind::Order,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
            ],
        );
    }

    public function generalThread(Business $business, User $customer): ConversationThread
    {
        return ConversationThread::query()->firstOrCreate(
            ['business_id' => $business->getKey(), 'customer_user_id' => $customer->getKey(), 'kind' => ConversationKind::General->value],
            ['order_id' => null, 'customer_name' => $customer->name, 'customer_email' => $customer->email],
        );
    }

    public function send(ConversationThread $thread, User $sender, Role $role, string $body, Request $request): ConversationMessage
    {
        return DB::transaction(function () use ($thread, $sender, $role, $body, $request): ConversationMessage {
            $locked = ConversationThread::query()->lockForUpdate()->findOrFail($thread->getKey());
            $message = $locked->messages()->create([
                'business_id' => $locked->business_id,
                'sender_user_id' => $sender->getKey(),
                'sender_role' => $role->value,
                'kind' => ConversationMessageKind::Human,
                'body' => trim($body),
                'sent_at' => now(),
            ]);
            $locked->update(['last_message_at' => $message->sent_at]);
            $this->notifyCounterpart(
                $locked,
                $sender->getKey(),
                UserNotificationType::Message,
                "New message from {$sender->name}",
                mb_strimwidth(trim($body), 0, 240, '…'),
            );
            $this->audit->record('message.sent', $request, $sender, $locked->business, ConversationMessage::class, $message->getKey(), [
                'thread_id' => $locked->getKey(),
                'thread_kind' => $locked->kind->value,
                'character_count' => mb_strlen(trim($body)),
            ]);

            return $message->load(['sender', 'thread.readStates']);
        });
    }

    public function markRead(ConversationThread $thread, User $user): void
    {
        $latestId = $thread->messages()->max('id');
        ConversationReadState::query()->updateOrCreate(
            ['conversation_thread_id' => $thread->getKey(), 'user_id' => $user->getKey()],
            ['business_id' => $thread->business_id, 'last_read_message_id' => $latestId, 'read_at' => now()],
        );
    }

    public function appendOrderActivity(Order $order, string $body, UserNotificationType $type, string $title, ?int $actorUserId = null): ConversationMessage
    {
        $thread = $this->threadForOrder($order);
        $message = $thread->messages()->create([
            'business_id' => $order->business_id,
            'sender_user_id' => null,
            'sender_role' => 'SYSTEM',
            'kind' => ConversationMessageKind::System,
            'body' => $body,
            'sent_at' => now(),
        ]);
        $thread->update(['last_message_at' => $message->sent_at]);
        $this->notifyCounterpart($thread, $actorUserId, $type, $title, $body);

        return $message;
    }

    public function notifyBusinessSupport(ConversationThread $thread, string $title, string $body): void
    {
        $support = $thread->business->memberships()
            ->where('is_active', true)
            ->whereIn('role', [Role::BusinessOwner->value, Role::Staff->value, Role::Cashier->value])
            ->with('user')->get()->pluck('user')->filter(fn (User $user) => $user->is_active);
        foreach ($support->unique('id') as $recipient) {
            $this->notifyUser($thread->business, $recipient, UserNotificationType::Message, $title, $body, 'THREAD', (string) $thread->getKey());
        }
    }

    public function notifyCustomer(ConversationThread $thread, string $title, string $body): void
    {
        if (! $thread->customer_user_id) {
            return;
        }
        $customer = User::query()->whereKey($thread->customer_user_id)->where('is_active', true)->first();
        if ($customer) {
            $this->notifyUser($thread->business, $customer, UserNotificationType::Message, $title, $body, 'THREAD', (string) $thread->getKey());
        }
    }

    private function notifyCounterpart(ConversationThread $thread, ?int $actorUserId, UserNotificationType $type, string $title, string $body): void
    {
        $recipients = collect();
        if ($thread->customer_user_id && $thread->customer_user_id !== $actorUserId) {
            $customer = User::query()->whereKey($thread->customer_user_id)->where('is_active', true)->first();
            if ($customer) {
                $recipients->push($customer);
            }
        }
        if ($thread->customer_user_id === $actorUserId || $actorUserId === null) {
            $support = $thread->business->memberships()
                ->where('is_active', true)
                ->whereIn('role', [Role::BusinessOwner->value, Role::Staff->value, Role::Cashier->value])
                ->with('user')->get()->pluck('user')->filter(fn (User $user) => $user->is_active && $user->getKey() !== $actorUserId);
            $recipients = $recipients->merge($support);
        }
        foreach ($recipients->unique('id') as $recipient) {
            $this->notifyUser($thread->business, $recipient, $type, $title, $body, 'THREAD', (string) $thread->getKey());
        }
    }

    public function notifyUser(Business $business, User $user, UserNotificationType $type, string $title, string $body, ?string $resourceType = null, ?string $resourceId = null): ?UserNotification
    {
        $column = $type->preferenceColumn();
        $preferences = NotificationPreference::query()->where('business_id', $business->getKey())->where('user_id', $user->getKey())->first();
        if ($column && $preferences && ! $preferences->{$column}) {
            return null;
        }
        $notification = UserNotification::query()->create([
            'business_id' => $business->getKey(),
            'user_id' => $user->getKey(),
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'created_at' => now(),
        ]);
        RealtimeEvent::query()->create([
            'business_id' => $business->getKey(),
            'user_id' => $user->getKey(),
            'type' => 'NOTIFICATION_CREATED',
            'resource_type' => 'NOTIFICATION',
            'resource_id' => (string) $notification->getKey(),
            'data' => ['notificationType' => $type->value],
            'occurred_at' => now(),
        ]);

        return $notification;
    }
}
