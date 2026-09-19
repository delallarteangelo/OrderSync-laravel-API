<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BusinessStatus;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\SaasPayload;
use App\Services\SubscriptionAdministrationService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlatformBusinessController extends Controller
{
    public function __construct(private readonly SubscriptionAdministrationService $administration) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::enum(BusinessStatus::class)],
            'search' => ['nullable', 'string', 'max:100'],
            'planCode' => ['nullable', Rule::in(['BASIC', 'STANDARD', 'PREMIUM', 'UNASSIGNED'])],
            'sort' => ['nullable', Rule::in(['name', 'status', 'planCode', 'userCount', 'periodEnd', 'createdAt'])],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'perPage' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);
        $direction = $validated['direction'] ?? 'desc';
        $sort = $validated['sort'] ?? 'createdAt';
        $query = Business::query()
            ->with(['subscription.plan.entitlements', 'memberships.user'])
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($validated['search'] ?? null, function ($query, $search): void {
                $query->where(fn ($inner) => $inner
                    ->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%'])
                    ->orWhereRaw('LOWER(slug) LIKE ?', ['%'.mb_strtolower($search).'%'])
                    ->orWhereHas('memberships.user', fn ($userQuery) => $userQuery
                        ->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%'])
                        ->orWhereRaw('LOWER(email) LIKE ?', ['%'.mb_strtolower($search).'%'])));
            })
            ->when(($validated['planCode'] ?? null) === 'UNASSIGNED', fn ($query) => $query->whereDoesntHave('subscription'))
            ->when(
                isset($validated['planCode']) && $validated['planCode'] !== 'UNASSIGNED',
                fn ($query) => $query->whereHas('subscription.plan', fn ($planQuery) => $planQuery->where('code', $validated['planCode']))
            )
            ->withCount([
                'memberships as active_memberships_count' => fn ($membershipQuery) => $membershipQuery->where('is_active', true),
            ]);

        match ($sort) {
            'name' => $query->orderBy('businesses.name', $direction),
            'status' => $query->orderBy('businesses.status', $direction),
            'planCode' => $query->orderBy(
                SubscriptionPlan::query()
                    ->select('subscription_plans.code')
                    ->join('subscriptions', 'subscriptions.subscription_plan_id', '=', 'subscription_plans.id')
                    ->whereColumn('subscriptions.business_id', 'businesses.id')
                    ->limit(1),
                $direction,
            ),
            'userCount' => $query->orderBy('active_memberships_count', $direction),
            'periodEnd' => $query->orderBy(
                Subscription::query()
                    ->select('current_period_end')
                    ->whereColumn('subscriptions.business_id', 'businesses.id')
                    ->limit(1),
                $direction,
            ),
            default => $query->orderBy('businesses.created_at', $direction),
        };

        $businesses = $query
            ->orderBy('businesses.id', $direction)
            ->paginate($validated['perPage'] ?? 10);

        return response()->json([
            'data' => $businesses->getCollection()->map(fn (Business $business) => SaasPayload::business($business))->all(),
            'meta' => [
                'currentPage' => $businesses->currentPage(),
                'lastPage' => $businesses->lastPage(),
                'perPage' => $businesses->perPage(),
                'total' => $businesses->total(),
            ],
        ]);
    }

    public function approve(Request $request, Business $business): JsonResponse
    {
        return $this->transition(fn () => $this->administration->approve($business, $request->user(), $request));
    }

    public function suspend(Request $request, Business $business): JsonResponse
    {
        $validated = $request->validate(['reason' => ['required', 'string', 'min:3', 'max:500']]);

        return $this->transition(fn () => $this->administration->suspend($business, $request->user(), $request, trim($validated['reason'])));
    }

    public function reactivate(Request $request, Business $business): JsonResponse
    {
        return $this->transition(fn () => $this->administration->reactivate($business, $request->user(), $request));
    }

    private function transition(callable $callback): JsonResponse
    {
        try {
            $business = $callback();
        } catch (DomainException $exception) {
            return response()->json(['code' => 'INVALID_BUSINESS_TRANSITION', 'message' => $exception->getMessage()], 409);
        }

        return response()->json(['business' => SaasPayload::business($business)]);
    }
}
