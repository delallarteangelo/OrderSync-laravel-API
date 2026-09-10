<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\NotificationPreference;
use App\Models\RealtimeEvent;
use App\Models\UserNotification;
use App\Services\AuditLogger;
use App\Services\MessagingPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = $this->notifications($request);
        $items = (clone $query)->latest('id')->limit(100)->get();

        return response()->json([
            'items' => $items->map(fn (UserNotification $notification): array => MessagingPayload::notification($notification))->all(),
            'unreadCount' => (clone $query)->whereNull('read_at')->count(),
        ]);
    }

    public function read(Request $request, UserNotification $notification): JsonResponse
    {
        abort_unless($notification->business_id === $this->business($request)->getKey() && $notification->user_id === $request->user()->getKey(), 404);
        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json(MessagingPayload::notification($notification));
    }

    public function readAll(Request $request): JsonResponse
    {
        $count = $this->notifications($request)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['updated' => $count]);
    }

    public function preferences(Request $request): JsonResponse
    {
        $preferences = NotificationPreference::query()->firstOrCreate(
            ['business_id' => $this->business($request)->getKey(), 'user_id' => $request->user()->getKey()],
            ['messages_enabled' => true, 'orders_enabled' => true, 'payments_enabled' => true],
        );

        return response()->json(MessagingPayload::preferences($preferences));
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'messagesEnabled' => ['required', 'boolean'],
            'ordersEnabled' => ['required', 'boolean'],
            'paymentsEnabled' => ['required', 'boolean'],
        ]);
        $preferences = NotificationPreference::query()->updateOrCreate(
            ['business_id' => $this->business($request)->getKey(), 'user_id' => $request->user()->getKey()],
            [
                'messages_enabled' => $validated['messagesEnabled'],
                'orders_enabled' => $validated['ordersEnabled'],
                'payments_enabled' => $validated['paymentsEnabled'],
            ],
        );
        $this->audit->record('notification.preferences_updated', $request, $request->user(), $this->business($request), NotificationPreference::class, $preferences->getKey(), [
            'messages_enabled' => $preferences->messages_enabled,
            'orders_enabled' => $preferences->orders_enabled,
            'payments_enabled' => $preferences->payments_enabled,
        ]);

        return response()->json(MessagingPayload::preferences($preferences));
    }

    public function events(Request $request): JsonResponse
    {
        $validated = $request->validate(['after' => ['nullable', 'integer', 'min:0'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $after = (int) ($validated['after'] ?? 0);
        $limit = (int) ($validated['limit'] ?? 100);
        $events = RealtimeEvent::query()
            ->where('business_id', $this->business($request)->getKey())
            ->where('user_id', $request->user()->getKey())
            ->where('id', '>', $after)->orderBy('id')->limit($limit)->get();

        return response()->json([
            'items' => $events->map(fn (RealtimeEvent $event): array => MessagingPayload::event($event))->all(),
            'cursor' => (string) ($events->last()?->getKey() ?? $after),
            'transport' => 'POLLING',
        ]);
    }

    private function notifications(Request $request)
    {
        return UserNotification::query()->where('business_id', $this->business($request)->getKey())->where('user_id', $request->user()->getKey());
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
