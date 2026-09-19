<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PaymentMethod;
use App\Exceptions\RecordedPaymentException;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\PlatformWallet;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionRequest;
use App\Models\User;
use App\Services\RecordedPaymentService;
use App\Services\SaasPayload;
use App\Services\SubscriptionRequestPayload;
use App\Services\SubscriptionRequestService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SubscriptionRequestController extends Controller
{
    public function __construct(
        private readonly SubscriptionRequestService $applications,
        private readonly RecordedPaymentService $payments,
    ) {}

    public function publicPlans(): JsonResponse
    {
        $plans = SubscriptionPlan::query()->with('entitlements')->where('is_active', true)->orderBy('id')->get();

        return response()->json(['plans' => $plans->map(fn (SubscriptionPlan $plan): array => SaasPayload::plan($plan))->all()]);
    }

    public function resume(Request $request): JsonResponse
    {
        $validated = $request->validate(['ownerEmail' => ['required', 'email'], 'password' => ['required', 'string']]);
        $owner = User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower(trim($validated['ownerEmail']))])->first();
        if (! $owner || ! Hash::check($validated['password'], $owner->password)) {
            return response()->json(['code' => 'APPLICATION_NOT_FOUND', 'message' => 'The application credentials could not be verified.'], 404);
        }
        $application = SubscriptionRequest::query()->where('requested_by_user_id', $owner->getKey())
            ->where('kind', 'INITIAL')->latest('id')->first();
        if (! $application) {
            return response()->json(['code' => 'APPLICATION_NOT_FOUND', 'message' => 'The application credentials could not be verified.'], 404);
        }

        return response()->json([
            'id' => (string) $application->getKey(),
            'applicationToken' => $this->applications->rotateApplicationToken($application),
        ]);
    }

    public function initialStatus(Request $request, SubscriptionRequest $application): JsonResponse
    {
        $this->applications->authenticateApplication($application, $request->header('X-Application-Token'));

        return response()->json([
            'application' => SubscriptionRequestPayload::request($application),
            'wallets' => $application->status === 'AWAITING_PAYMENT'
                ? PlatformWallet::query()->where('is_active', true)->get()->map(fn (PlatformWallet $wallet): array => SubscriptionRequestPayload::wallet($wallet))->all()
                : [],
        ]);
    }

    public function initialPayment(Request $request, SubscriptionRequest $application): JsonResponse
    {
        $this->applications->authenticateApplication($application, $request->header('X-Application-Token'));
        abort_unless($application->status === 'AWAITING_PAYMENT' && $application->bill, 409);
        $validated = $this->validateProof($request);
        try {
            $payment = $this->payments->submitSubscriptionPayment(
                $application->bill, $application->requester, $request,
                PaymentMethod::from($validated['method']), trim($validated['referenceNumber']), $request->file('proof'),
            );
        } catch (RecordedPaymentException $exception) {
            return response()->json(['code' => $exception->errorCode, 'message' => $exception->getMessage()], $exception->status);
        }

        return response()->json(['application' => SubscriptionRequestPayload::request($application->refresh()), 'paymentId' => (string) $payment->getKey()], 201);
    }

    public function tenantIndex(Request $request): JsonResponse
    {
        $items = SubscriptionRequest::query()->where('business_id', $this->business($request)->getKey())
            ->with(['business', 'requester', 'desiredPlan.entitlements', 'fromPlan.entitlements', 'bill.payments'])
            ->latest('id')->limit(30)->get();

        return response()->json(['items' => $items->map(fn (SubscriptionRequest $item): array => SubscriptionRequestPayload::request($item))->all()]);
    }

    public function tenantUpgrade(Request $request): JsonResponse
    {
        $validated = $request->validate(['planCode' => ['required', Rule::in(['STANDARD', 'PREMIUM'])]]);
        $plan = SubscriptionPlan::query()->where('code', $validated['planCode'])->firstOrFail();
        try {
            $application = $this->applications->requestUpgrade($this->business($request), $request->user(), $plan, $request);
        } catch (DomainException $exception) {
            return response()->json(['code' => 'UPGRADE_NOT_ALLOWED', 'message' => $exception->getMessage()], 409);
        }

        return response()->json(SubscriptionRequestPayload::request($application), 201);
    }

    public function tenantCancel(Request $request, SubscriptionRequest $application): JsonResponse
    {
        abort_unless($application->business_id === $this->business($request)->getKey(), 404);
        try {
            $application = $this->applications->cancelUpgrade($application, $request->user(), $request);
        } catch (DomainException $exception) {
            return response()->json(['code' => 'UPGRADE_CANCEL_NOT_ALLOWED', 'message' => $exception->getMessage()], 409);
        }

        return response()->json(SubscriptionRequestPayload::request($application));
    }

    public function platformIndex(): JsonResponse
    {
        $items = SubscriptionRequest::query()->with(['business', 'requester', 'desiredPlan.entitlements', 'fromPlan.entitlements', 'bill.payments'])
            ->latest('id')->limit(100)->get();

        return response()->json(['items' => $items->map(fn (SubscriptionRequest $item): array => SubscriptionRequestPayload::request($item, true))->all()]);
    }

    public function platformReview(Request $request, SubscriptionRequest $application): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', Rule::in(['APPROVE', 'REJECT'])],
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);
        try {
            $application = $this->applications->review($application, $request->user(), $request, $validated['decision'] === 'APPROVE', $validated['reason'] ?? null);
        } catch (DomainException $exception) {
            return response()->json(['code' => 'SUBSCRIPTION_REVIEW_NOT_ALLOWED', 'message' => $exception->getMessage()], 409);
        }

        return response()->json(SubscriptionRequestPayload::request($application, true));
    }

    public function platformWallets(): JsonResponse
    {
        return response()->json(['items' => PlatformWallet::query()->orderBy('method')->get()
            ->map(fn (PlatformWallet $wallet): array => SubscriptionRequestPayload::wallet($wallet))->all()]);
    }

    public function tenantWallets(): JsonResponse
    {
        return response()->json(['items' => PlatformWallet::query()->where('is_active', true)->orderBy('method')->get()
            ->map(fn (PlatformWallet $wallet): array => SubscriptionRequestPayload::wallet($wallet))->all()]);
    }

    public function updatePlatformWallet(Request $request, string $method): JsonResponse
    {
        abort_unless(in_array($method, ['GCASH', 'MAYA'], true), 404);
        $validated = $request->validate([
            'accountName' => ['required', 'string', 'max:120'],
            'accountNumber' => ['required', 'string', 'max:40'],
            'isActive' => ['required', 'boolean'],
        ]);
        $wallet = PlatformWallet::query()->updateOrCreate(['method' => $method], [
            'account_name' => trim($validated['accountName']),
            'account_number' => trim($validated['accountNumber']),
            'is_active' => $validated['isActive'],
            'updated_by_user_id' => $request->user()->getKey(),
        ]);

        return response()->json(SubscriptionRequestPayload::wallet($wallet));
    }

    private function validateProof(Request $request): array
    {
        return $request->validate([
            'method' => ['required', Rule::in(['GCASH', 'MAYA'])],
            'referenceNumber' => ['required', 'string', 'max:120'],
            'proof' => ['required', 'file', 'mimes:jpeg,jpg,png,webp,pdf', 'max:5120'],
        ]);
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
