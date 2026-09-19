<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PaymentMethod;
use App\Enums\RecordedPaymentContext;
use App\Enums\RecordedPaymentStatus;
use App\Exceptions\RecordedPaymentException;
use App\Http\Controllers\Controller;
use App\Models\BillingRecord;
use App\Models\Business;
use App\Models\Order;
use App\Models\RecordedPayment;
use DomainException;
use App\Services\RecordedPaymentPayload;
use App\Services\RecordedPaymentService;
use App\Services\SaasPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RecordedPaymentController extends Controller
{
    public function __construct(private readonly RecordedPaymentService $payments) {}

    public function businessIndex(Request $request): JsonResponse
    {
        return $this->listing($request, RecordedPaymentContext::CustomerOrder, $this->business($request)->getKey());
    }

    public function platformIndex(Request $request): JsonResponse
    {
        return $this->listing($request, RecordedPaymentContext::Subscription, null);
    }

    private function listing(Request $request, RecordedPaymentContext $context, ?int $businessId): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::enum(RecordedPaymentStatus::class)],
            'method' => ['nullable', Rule::in([PaymentMethod::GCash->value, PaymentMethod::Maya->value])],
        ]);
        $query = RecordedPayment::query()->where('context', $context->value)
            ->with(['business', 'order', 'billingRecord', 'submitter', 'reviewer', 'reviewEvents'])
            ->when($businessId, fn ($builder, int $id) => $builder->where('business_id', $id))
            ->when($validated['status'] ?? null, fn ($builder, string $status) => $builder->where('status', $status))
            ->when($validated['method'] ?? null, fn ($builder, string $method) => $builder->where('method', $method))
            ->latest('submitted_at')->paginate(50);

        return response()->json([
            'items' => $query->getCollection()->map(fn (RecordedPayment $payment): array => RecordedPaymentPayload::payment($payment))->all(),
            'meta' => ['currentPage' => $query->currentPage(), 'lastPage' => $query->lastPage(), 'total' => $query->total()],
        ]);
    }

    public function customerOrderIndex(Request $request, Order $order): JsonResponse
    {
        $this->ensureCustomerOrder($request, $order);
        $items = $order->payments()->with(['business', 'order', 'submitter', 'reviewer', 'reviewEvents'])->latest('submitted_at')->get();

        return response()->json(['items' => $items->map(fn (RecordedPayment $payment): array => RecordedPaymentPayload::payment($payment))->all()]);
    }

    public function customerOrderStore(Request $request, Order $order): JsonResponse
    {
        $this->ensureCustomerOrder($request, $order);
        [$method, $reference, $proof] = $this->validateSubmission($request);
        $validated = $request->validate(['claimedAmountMinor' => ['nullable', 'integer', 'min:1']]);
        try {
            $payment = $this->payments->submitOrderPayment($order, $request->user(), $request, $method, $reference, $proof, $validated['claimedAmountMinor'] ?? null);
        } catch (RecordedPaymentException $exception) {
            return $this->error($exception);
        }

        return response()->json(RecordedPaymentPayload::payment($payment), 201);
    }

    public function tenantBillingRecords(Request $request): JsonResponse
    {
        $records = BillingRecord::query()->where('business_id', $this->business($request)->getKey())
            ->with(['payments.business', 'payments.submitter', 'payments.reviewer', 'payments.reviewEvents'])
            ->latest('due_at')->get();

        return response()->json(['items' => $records->map(fn (BillingRecord $record): array => [
            ...SaasPayload::billingRecord($record),
            'payments' => $record->payments->map(fn (RecordedPayment $payment): array => RecordedPaymentPayload::payment($payment))->all(),
        ])->all()]);
    }

    public function tenantBillingStore(Request $request, BillingRecord $billingRecord): JsonResponse
    {
        abort_unless($billingRecord->business_id === $this->business($request)->getKey(), 404);
        [$method, $reference, $proof] = $this->validateSubmission($request);
        try {
            $payment = $this->payments->submitSubscriptionPayment($billingRecord, $request->user(), $request, $method, $reference, $proof);
        } catch (RecordedPaymentException $exception) {
            return $this->error($exception);
        }

        return response()->json(RecordedPaymentPayload::payment($payment), 201);
    }

    public function businessReview(Request $request, RecordedPayment $payment): JsonResponse
    {
        abort_unless($payment->business_id === $this->business($request)->getKey() && $payment->context === RecordedPaymentContext::CustomerOrder, 404);

        return $this->review($request, $payment);
    }

    public function platformReview(Request $request, RecordedPayment $payment): JsonResponse
    {
        abort_unless($payment->context === RecordedPaymentContext::Subscription, 404);

        return $this->review($request, $payment);
    }

    private function review(Request $request, RecordedPayment $payment): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', Rule::in([RecordedPaymentStatus::Verified->value, RecordedPaymentStatus::Rejected->value])],
            'reason' => ['nullable', 'string', 'max:2000'],
            'walletReceiptConfirmed' => ['sometimes', 'boolean'],
            'verifiedAmountMinor' => ['nullable', 'integer', 'min:1'],
        ]);
        try {
            $payment = $this->payments->review($payment, $request->user(), $request, RecordedPaymentStatus::from($validated['decision']), $validated['reason'] ?? null, (bool) ($validated['walletReceiptConfirmed'] ?? false), $validated['verifiedAmountMinor'] ?? null);
        } catch (RecordedPaymentException $exception) {
            return $this->error($exception);
        } catch (DomainException $exception) {
            return response()->json(['code' => 'SUBSCRIPTION_REVIEW_NOT_ALLOWED', 'message' => $exception->getMessage()], 409);
        }

        return response()->json(RecordedPaymentPayload::payment($payment));
    }

    public function customerProof(Request $request, RecordedPayment $payment): StreamedResponse
    {
        abort_unless($payment->context === RecordedPaymentContext::CustomerOrder && $payment->order?->customer_user_id === $request->user()->getKey() && $payment->business_id === $this->business($request)->getKey(), 404);

        return $this->proof($payment);
    }

    public function businessProof(Request $request, RecordedPayment $payment): StreamedResponse
    {
        abort_unless($payment->context === RecordedPaymentContext::CustomerOrder && $payment->business_id === $this->business($request)->getKey(), 404);

        return $this->proof($payment);
    }

    public function tenantProof(Request $request, RecordedPayment $payment): StreamedResponse
    {
        abort_unless($payment->context === RecordedPaymentContext::Subscription && $payment->business_id === $this->business($request)->getKey(), 404);

        return $this->proof($payment);
    }

    public function platformProof(RecordedPayment $payment): StreamedResponse
    {
        abort_unless($payment->context === RecordedPaymentContext::Subscription, 404);

        return $this->proof($payment);
    }

    private function proof(RecordedPayment $payment): StreamedResponse
    {
        abort_unless($payment->proof_path && ! $payment->proof_deleted_at && Storage::disk($payment->proof_disk)->exists($payment->proof_path), 404);

        return Storage::disk($payment->proof_disk)->download(
            $payment->proof_path,
            "payment-proof-{$payment->getKey()}",
            ['Content-Type' => $payment->proof_mime_type, 'Cache-Control' => 'private, no-store'],
        );
    }

    public function customerReceipt(Request $request, RecordedPayment $payment): JsonResponse
    {
        abort_unless($payment->context === RecordedPaymentContext::CustomerOrder && $payment->order?->customer_user_id === $request->user()->getKey() && $payment->business_id === $this->business($request)->getKey(), 404);

        return response()->json(RecordedPaymentPayload::receipt($payment));
    }

    public function businessReceipt(Request $request, RecordedPayment $payment): JsonResponse
    {
        abort_unless($payment->context === RecordedPaymentContext::CustomerOrder && $payment->business_id === $this->business($request)->getKey(), 404);

        return response()->json(RecordedPaymentPayload::receipt($payment));
    }

    public function tenantReceipt(Request $request, RecordedPayment $payment): JsonResponse
    {
        abort_unless($payment->context === RecordedPaymentContext::Subscription && $payment->business_id === $this->business($request)->getKey(), 404);

        return response()->json(RecordedPaymentPayload::receipt($payment));
    }

    public function platformReceipt(RecordedPayment $payment): JsonResponse
    {
        abort_unless($payment->context === RecordedPaymentContext::Subscription, 404);

        return response()->json(RecordedPaymentPayload::receipt($payment));
    }

    /** @return array{PaymentMethod,string,UploadedFile} */
    private function validateSubmission(Request $request): array
    {
        $validated = $request->validate([
            'method' => ['required', Rule::in([PaymentMethod::GCash->value, PaymentMethod::Maya->value])],
            'referenceNumber' => ['required', 'string', 'max:120'],
            'proof' => ['required', 'file', 'mimes:jpeg,jpg,png,webp,pdf', 'max:5120'],
        ]);

        return [PaymentMethod::from($validated['method']), trim($validated['referenceNumber']), $request->file('proof')];
    }

    private function ensureCustomerOrder(Request $request, Order $order): void
    {
        abort_unless($order->business_id === $this->business($request)->getKey() && $order->customer_user_id === $request->user()->getKey(), 404);
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }

    private function error(RecordedPaymentException $exception): JsonResponse
    {
        return response()->json([
            'code' => $exception->errorCode,
            'message' => $exception->getMessage(),
            ...($exception->fieldErrors === [] ? [] : ['fieldErrors' => $exception->fieldErrors]),
        ], $exception->status);
    }
}
