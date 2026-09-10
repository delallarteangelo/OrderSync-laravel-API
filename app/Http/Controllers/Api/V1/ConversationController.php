<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\ConversationThread;
use App\Models\Order;
use App\Services\MessagingPayload;
use App\Services\MessagingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function __construct(private readonly MessagingService $messaging) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ConversationThread::query()
            ->where('business_id', $this->business($request)->getKey())
            ->when($this->role($request) === Role::Customer, fn ($builder) => $builder->where('customer_user_id', $user->getKey()))
            ->with(['order', 'messages' => fn ($builder) => $builder->latest('id')->limit(1)])
            ->orderByDesc('last_message_at')->orderByDesc('id')->limit(100)->get();

        $items = $query->map(fn (ConversationThread $thread): array => MessagingPayload::thread($thread, $user));

        return response()->json([
            'items' => $items->all(),
            'unreadCount' => $items->sum('unreadCount'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($this->role($request) === Role::Customer, 403);
        $validated = $request->validate(['orderId' => ['nullable', 'integer']]);
        if (isset($validated['orderId'])) {
            $order = Order::query()->where('business_id', $this->business($request)->getKey())
                ->where('customer_user_id', $request->user()->getKey())->findOrFail($validated['orderId']);
            $thread = $this->messaging->threadForOrder($order);
        } else {
            $thread = $this->messaging->generalThread($this->business($request), $request->user());
        }

        return response()->json(MessagingPayload::thread($thread, $request->user()), 201);
    }

    public function messages(Request $request, ConversationThread $thread): JsonResponse
    {
        $this->authorizeThread($request, $thread);
        $items = $thread->messages()->with(['sender', 'thread.readStates'])->latest('id')->limit(100)->get()->reverse()->values();

        return response()->json(['items' => $items->map(fn ($message): array => MessagingPayload::message($message, $request->user()))->all()]);
    }

    public function send(Request $request, ConversationThread $thread): JsonResponse
    {
        $this->authorizeThread($request, $thread);
        $validated = $request->validate(['body' => ['required', 'string', 'max:4000']]);
        $message = $this->messaging->send($thread, $request->user(), $this->role($request), $validated['body'], $request);

        return response()->json(MessagingPayload::message($message, $request->user()), 201);
    }

    public function read(Request $request, ConversationThread $thread): JsonResponse
    {
        $this->authorizeThread($request, $thread);
        $this->messaging->markRead($thread, $request->user());

        return response()->json(['read' => true]);
    }

    private function authorizeThread(Request $request, ConversationThread $thread): void
    {
        abort_unless($thread->business_id === $this->business($request)->getKey(), 404);
        if ($this->role($request) === Role::Customer) {
            abort_unless($thread->customer_user_id === $request->user()->getKey(), 404);
        }
    }

    private function role(Request $request): Role
    {
        return $request->attributes->get('currentMembership')->role;
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
