<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Exceptions\OrderWorkflowException;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Order;
use App\Services\CustomerOrderService;
use App\Services\OrderPayload;
use App\Services\OrderSettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(private readonly CustomerOrderService $orders, private readonly OrderSettlementService $settlement) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
            'search' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);
        $orders = Order::query()
            ->where('business_id', $this->business($request)->getKey())
            ->with(['business', 'lines', 'statusEvents'])
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $term = '%'.mb_strtolower(trim($search)).'%';
                $query->where(fn ($inner) => $inner->whereRaw('LOWER(order_number) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(customer_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(customer_email) LIKE ?', [$term]));
            })
            ->when($validated['from'] ?? null, fn ($query, string $from) => $query->whereDate('placed_at', '>=', $from))
            ->when($validated['to'] ?? null, fn ($query, string $to) => $query->whereDate('placed_at', '<=', $to))
            ->latest('placed_at')
            ->paginate(50);

        return response()->json([
            'items' => $orders->getCollection()->map(fn (Order $order): array => OrderPayload::order($order))->all(),
            'meta' => ['currentPage' => $orders->currentPage(), 'lastPage' => $orders->lastPage(), 'total' => $orders->total()],
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->business_id === $this->business($request)->getKey(), 404);

        return response()->json(OrderPayload::order($order));
    }

    public function transition(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->business_id === $this->business($request)->getKey(), 404);
        $validated = $request->validate([
            'next' => ['required', Rule::enum(OrderStatus::class)],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $order = $this->orders->transition(
                $order,
                $request->user(),
                $request,
                OrderStatus::from($validated['next']),
                $validated['note'] ?? null,
            );
        } catch (OrderWorkflowException $exception) {
            return response()->json([
                'code' => $exception->errorCode,
                'message' => $exception->getMessage(),
                ...($exception->fieldErrors === [] ? [] : ['fieldErrors' => $exception->fieldErrors]),
            ], $exception->status);
        }

        return response()->json(OrderPayload::order($order));
    }

    public function collectCounter(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->business_id === $this->business($request)->getKey(), 404);
        $validated = $request->validate(['amountMinor' => ['required', 'integer', 'min:1'], 'referenceNumber' => ['required', 'string', 'max:120']]);
        try {
            return response()->json(OrderPayload::order($this->settlement->collectCounter($order, $request->user(), $request, $validated['amountMinor'], $validated['referenceNumber'])));
        } catch (OrderWorkflowException $exception) {
            return $this->error($exception);
        }
    }

    public function recordRefund(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->business_id === $this->business($request)->getKey(), 404);
        $validated = $request->validate([
            'method' => ['required', Rule::in(['GCASH', 'MAYA', 'CASH'])],
            'referenceNumber' => ['required', 'string', 'max:120'],
            'amountMinor' => ['required', 'integer', 'min:1'],
            'refundConfirmed' => ['required', 'accepted'],
        ]);
        try {
            return response()->json(OrderPayload::order($this->settlement->recordRefund($order, $request->user(), $request, $validated['method'], $validated['referenceNumber'], $validated['amountMinor'])));
        } catch (OrderWorkflowException $exception) {
            return $this->error($exception);
        }
    }

    private function error(OrderWorkflowException $exception): JsonResponse
    {
        return response()->json(['code' => $exception->errorCode, 'message' => $exception->getMessage(),
            ...($exception->fieldErrors === [] ? [] : ['fieldErrors' => $exception->fieldErrors])], $exception->status);
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
