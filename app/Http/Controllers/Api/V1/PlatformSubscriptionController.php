<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BillingRecord;
use App\Models\Business;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\SaasPayload;
use App\Services\SubscriptionAdministrationService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformSubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionAdministrationService $administration) {}

    public function assign(Request $request, Business $business): JsonResponse
    {
        $validated = $request->validate([
            'planCode' => ['required', 'string', 'in:BASIC,STANDARD,PREMIUM'],
            'months' => ['sometimes', 'integer', 'min:1', 'max:24'],
        ]);
        $plan = SubscriptionPlan::query()->where('code', $validated['planCode'])->firstOrFail();

        return $this->subscriptionTransition(fn () => $this->administration->assign(
            $business,
            $plan,
            $validated['months'] ?? 1,
            $request->user(),
            $request,
        ));
    }

    public function renew(Request $request, Subscription $subscription): JsonResponse
    {
        $validated = $request->validate(['months' => ['required', 'integer', 'min:1', 'max:24']]);

        return $this->subscriptionTransition(fn () => $this->administration->renew($subscription, $validated['months'], $request->user(), $request));
    }

    public function grace(Request $request, Subscription $subscription): JsonResponse
    {
        $validated = $request->validate(['days' => ['required', 'integer', 'min:1', 'max:90']]);

        return $this->subscriptionTransition(fn () => $this->administration->grantGrace($subscription, $validated['days'], $request->user(), $request));
    }

    public function cancel(Request $request, Subscription $subscription): JsonResponse
    {
        return $this->subscriptionTransition(fn () => $this->administration->cancel($subscription, $request->user(), $request));
    }

    public function history(Subscription $subscription): JsonResponse
    {
        $events = $subscription->events()->with('actor')->latest('id')->get();

        return response()->json(['events' => $events->map(fn ($event): array => [
            'id' => (string) $event->getKey(),
            'eventType' => $event->event_type,
            'fromStatus' => $event->from_status,
            'toStatus' => $event->to_status,
            'fromPlanCode' => $event->from_plan_code,
            'toPlanCode' => $event->to_plan_code,
            'metadata' => $event->metadata,
            'actor' => $event->actor ? ['id' => (string) $event->actor->getKey(), 'fullName' => $event->actor->name] : null,
            'createdAt' => $event->created_at->toIso8601String(),
        ])->all()]);
    }

    public function billingIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'businessId' => ['nullable', 'integer', 'exists:businesses,id'],
            'status' => ['nullable', 'string', 'in:PENDING,PAID,OVERDUE,VOID'],
        ]);
        $records = BillingRecord::query()
            ->with('business')
            ->when($validated['businessId'] ?? null, fn ($query, $businessId) => $query->where('business_id', $businessId))
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->latest('id')
            ->paginate(50);

        return response()->json([
            'data' => $records->getCollection()->map(fn (BillingRecord $record) => SaasPayload::billingRecord($record))->all(),
            'meta' => ['currentPage' => $records->currentPage(), 'lastPage' => $records->lastPage(), 'total' => $records->total()],
        ]);
    }

    public function createBilling(Request $request, Subscription $subscription): JsonResponse
    {
        $validated = $request->validate([
            'amountMinor' => ['required', 'integer', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3', 'in:PHP'],
            'periodStart' => ['required', 'date'],
            'periodEnd' => ['required', 'date', 'after:periodStart'],
            'dueAt' => ['required', 'date'],
            'reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
        $record = $this->administration->createBillingRecord($subscription, [
            'amount_minor' => $validated['amountMinor'],
            'currency' => $validated['currency'] ?? 'PHP',
            'period_start' => $validated['periodStart'],
            'period_end' => $validated['periodEnd'],
            'due_at' => $validated['dueAt'],
            'reference' => $validated['reference'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ], $request->user(), $request);

        return response()->json(['billingRecord' => SaasPayload::billingRecord($record)], 201);
    }

    public function markBillingPaid(Request $request, BillingRecord $billingRecord): JsonResponse
    {
        $validated = $request->validate(['reference' => ['nullable', 'string', 'max:120']]);
        try {
            $record = $this->administration->markBillingPaid($billingRecord, $validated['reference'] ?? null, $request->user(), $request);
        } catch (DomainException $exception) {
            return response()->json(['code' => 'INVALID_BILLING_TRANSITION', 'message' => $exception->getMessage()], 409);
        }

        return response()->json(['billingRecord' => SaasPayload::billingRecord($record)]);
    }

    private function subscriptionTransition(callable $callback): JsonResponse
    {
        try {
            $subscription = $callback();
        } catch (DomainException $exception) {
            return response()->json(['code' => 'INVALID_SUBSCRIPTION_TRANSITION', 'message' => $exception->getMessage()], 409);
        }

        return response()->json(['subscription' => SaasPayload::subscription($subscription)]);
    }
}
