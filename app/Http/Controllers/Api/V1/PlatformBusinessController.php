<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BusinessStatus;
use App\Http\Controllers\Controller;
use App\Models\Business;
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
        ]);
        $businesses = Business::query()
            ->with(['subscription.plan.entitlements', 'memberships.user'])
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($validated['search'] ?? null, function ($query, $search): void {
                $query->where(fn ($inner) => $inner
                    ->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%'])
                    ->orWhereRaw('LOWER(slug) LIKE ?', ['%'.mb_strtolower($search).'%']));
            })
            ->latest('id')
            ->paginate(50);

        return response()->json([
            'data' => $businesses->getCollection()->map(fn (Business $business) => SaasPayload::business($business))->all(),
            'meta' => ['currentPage' => $businesses->currentPage(), 'lastPage' => $businesses->lastPage(), 'total' => $businesses->total()],
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
