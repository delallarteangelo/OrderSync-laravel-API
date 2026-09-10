<?php

namespace App\Services;

use App\Models\ConversationMessage;
use App\Models\ConversationThread;
use App\Models\NotificationPreference;
use App\Models\RealtimeEvent;
use App\Models\User;
use App\Models\UserNotification;

class MessagingPayload
{
    public static function thread(ConversationThread $thread, User $viewer): array
    {
        $thread->loadMissing(['order', 'messages' => fn ($query) => $query->latest('id')->limit(1)]);
        $last = $thread->messages->first();
        $read = $thread->readStates()->where('user_id', $viewer->getKey())->first();
        $unread = $thread->messages()
            ->when($read?->last_read_message_id, fn ($query, int $id) => $query->where('id', '>', $id))
            ->where(fn ($query) => $query->whereNull('sender_user_id')->orWhere('sender_user_id', '<>', $viewer->getKey()))
            ->count();

        return [
            'id' => (string) $thread->getKey(),
            'kind' => $thread->kind->value,
            'orderId' => $thread->order_id === null ? null : (string) $thread->order_id,
            'orderCode' => $thread->order?->order_number,
            'customer' => ['id' => $thread->customer_user_id === null ? null : (string) $thread->customer_user_id, 'name' => $thread->customer_name],
            'lastMessage' => $last?->body ?? '',
            'lastMessageAt' => $thread->last_message_at?->toIso8601String(),
            'unreadCount' => $unread,
        ];
    }

    public static function message(ConversationMessage $message, User $viewer): array
    {
        $message->loadMissing('sender');
        $readByRecipient = $message->thread->readStates()
            ->where('user_id', '<>', $message->sender_user_id ?? 0)
            ->where('last_read_message_id', '>=', $message->getKey())
            ->exists();

        return [
            'id' => (string) $message->getKey(),
            'threadId' => (string) $message->conversation_thread_id,
            'senderId' => $message->sender_user_id === null ? 'system' : (string) $message->sender_user_id,
            'senderName' => $message->sender?->name ?? 'OrderSync',
            'senderRole' => $message->sender_role,
            'kind' => $message->kind->value,
            'body' => $message->body,
            'sentAt' => $message->sent_at->toIso8601String(),
            'status' => $readByRecipient ? 'read' : 'sent',
            'mine' => $message->sender_user_id === $viewer->getKey(),
        ];
    }

    public static function notification(UserNotification $notification): array
    {
        return [
            'id' => (string) $notification->getKey(),
            'type' => $notification->type->value,
            'title' => $notification->title,
            'body' => $notification->body,
            'resourceType' => $notification->resource_type,
            'resourceId' => $notification->resource_id,
            'readAt' => $notification->read_at?->toIso8601String(),
            'createdAt' => $notification->created_at->toIso8601String(),
        ];
    }

    public static function preferences(NotificationPreference $preferences): array
    {
        return [
            'messagesEnabled' => $preferences->messages_enabled,
            'ordersEnabled' => $preferences->orders_enabled,
            'paymentsEnabled' => $preferences->payments_enabled,
        ];
    }

    public static function event(RealtimeEvent $event): array
    {
        return [
            'id' => (string) $event->getKey(),
            'type' => $event->type,
            'resourceType' => $event->resource_type,
            'resourceId' => $event->resource_id,
            'data' => $event->data ?? (object) [],
            'occurredAt' => $event->occurred_at->toIso8601String(),
        ];
    }
}
