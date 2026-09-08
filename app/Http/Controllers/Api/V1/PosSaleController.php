<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PaymentMethod;
use App\Exceptions\PosSaleException;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Sale;
use App\Services\PosPayload;
use App\Services\PosSaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PosSaleController extends Controller
{
    public function __construct(private readonly PosSaleService $sales) {}

    public function index(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $validated = $request->validate([
            'paymentMethod' => ['nullable', Rule::enum(PaymentMethod::class)],
            'cashierId' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $sales = Sale::query()->where('business_id', $business->getKey())
            ->with(['lines', 'business'])
            ->when($validated['paymentMethod'] ?? null, fn ($query, string $method) => $query->where('payment_method', $method))
            ->when($validated['cashierId'] ?? null, fn ($query, int $cashierId) => $query->where('cashier_user_id', $cashierId))
            ->when($validated['from'] ?? null, fn ($query, string $from) => $query->where('completed_at', '>=', $from))
            ->when($validated['to'] ?? null, fn ($query, string $to) => $query->where('completed_at', '<=', $to))
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $term = '%'.mb_strtolower(trim($search)).'%';
                $query->where(fn ($inner) => $inner->whereRaw('LOWER(receipt_number) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(sale_number) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(cashier_name) LIKE ?', [$term]));
            })
            ->latest('completed_at')->paginate(50);

        return response()->json([
            'items' => $sales->getCollection()->map(fn (Sale $sale) => PosPayload::sale($sale))->all(),
            'meta' => ['currentPage' => $sales->currentPage(), 'lastPage' => $sales->lastPage(), 'total' => $sales->total()],
        ]);
    }

    public function show(Request $request, Sale $sale): JsonResponse
    {
        abort_unless($sale->business_id === $this->business($request)->getKey(), 404);

        return response()->json(PosPayload::sale($sale));
    }

    public function store(Request $request): JsonResponse
    {
        $idempotencyKey = trim((string) $request->header('Idempotency-Key'));
        $request->merge(['idempotencyKey' => $idempotencyKey]);
        $validated = $request->validate([
            'idempotencyKey' => ['required', 'string', 'min:8', 'max:120', 'regex:/^[A-Za-z0-9._:-]+$/'],
            'lines' => ['required', 'array', 'min:1', 'max:100'],
            'lines.*.productId' => ['required', 'integer', 'distinct'],
            'lines.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'lines.*.lineDiscount' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'paymentMethod' => ['required', Rule::enum(PaymentMethod::class)],
            'tendered' => ['required_if:paymentMethod,CASH', 'prohibited_unless:paymentMethod,CASH', 'nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'paymentReference' => ['required_unless:paymentMethod,CASH', 'prohibited_if:paymentMethod,CASH', 'nullable', 'string', 'max:120'],
        ]);

        try {
            $result = $this->sales->finalize(
                $this->business($request),
                $request->user(),
                $request->attributes->get('currentRole'),
                $request,
                $validated,
                $idempotencyKey,
            );
        } catch (PosSaleException $exception) {
            return response()->json([
                'code' => $exception->errorCode,
                'message' => $exception->getMessage(),
                ...($exception->fieldErrors === [] ? [] : ['fieldErrors' => $exception->fieldErrors]),
            ], $exception->status);
        }

        return response()->json(
            PosPayload::sale($result['sale']),
            $result['replayed'] ? 200 : 201,
            ['Idempotency-Replayed' => $result['replayed'] ? 'true' : 'false'],
        );
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
