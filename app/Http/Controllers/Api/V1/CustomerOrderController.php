<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\OrderWorkflowException;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Order;
use App\Services\CustomerOrderService;
use App\Services\OrderPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerOrderController extends Controller
{
    public function __construct(private readonly CustomerOrderService $orders) {}

    public function index(Request $request): JsonResponse
    {
        $items = Order::query()
            ->where('business_id', $this->business($request)->getKey())
            ->where('customer_user_id', $request->user()->getKey())
            ->with(['business', 'lines', 'statusEvents'])
            ->latest('placed_at')
            ->get()
            ->map(fn (Order $order): array => OrderPayload::order($order))
            ->all();

        return response()->json(['items' => $items]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        abort_unless(
            $order->business_id === $this->business($request)->getKey()
            && $order->customer_user_id === $request->user()->getKey(),
            404,
        );

        return response()->json(OrderPayload::order($order));
    }

    public function store(Request $request): JsonResponse
    {
        $idempotencyKey = trim((string) $request->header('Idempotency-Key'));
        $request->merge(['idempotencyKey' => $idempotencyKey]);
        $validated = $request->validate([
            'idempotencyKey' => ['required', 'string', 'min:8', 'max:120', 'regex:/^[A-Za-z0-9._:-]+$/'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.productId' => ['required', 'integer', 'distinct'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
        ]);

        try {
            $result = $this->orders->place(
                $this->business($request),
                $request->user(),
                $request,
                $validated,
                $idempotencyKey,
            );
        } catch (OrderWorkflowException $exception) {
            return $this->error($exception);
        }

        return response()->json(
            OrderPayload::order($result['order']),
            $result['replayed'] ? 200 : 201,
            ['Idempotency-Replayed' => $result['replayed'] ? 'true' : 'false'],
        );
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->business_id === $this->business($request)->getKey(), 404);
        $validated = $request->validate(['note' => ['nullable', 'string', 'max:1000']]);

        try {
            $order = $this->orders->cancel($order, $request->user(), $request, $validated['note'] ?? null);
        } catch (OrderWorkflowException $exception) {
            return $this->error($exception);
        }

        return response()->json(OrderPayload::order($order));
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }

    private function error(OrderWorkflowException $exception): JsonResponse
    {
        return response()->json([
            'code' => $exception->errorCode,
            'message' => $exception->getMessage(),
            ...($exception->fieldErrors === [] ? [] : ['fieldErrors' => $exception->fieldErrors]),
        ], $exception->status);
    }
}
