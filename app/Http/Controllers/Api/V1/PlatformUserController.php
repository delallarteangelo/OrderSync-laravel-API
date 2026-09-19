<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\AuthTokenService;
use App\Services\SaasPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PlatformUserController extends Controller
{
    public function __construct(
        private readonly AuthTokenService $tokens,
        private readonly AuditLogger $audit,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'isActive' => ['nullable', Rule::in(['0', '1', 'true', 'false', 0, 1, true, false])],
            'access' => ['nullable', Rule::in(['SUPER_ADMIN', 'TENANT'])],
            'membershipRole' => ['nullable', Rule::in(['BUSINESS_OWNER', 'STAFF', 'CASHIER', 'CUSTOMER'])],
            'sort' => ['nullable', Rule::in(['fullName', 'email', 'access', 'membershipsCount', 'isActive', 'createdAt'])],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'perPage' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);
        $direction = $validated['direction'] ?? 'desc';
        $sort = $validated['sort'] ?? 'createdAt';
        $query = User::query()
            ->with('memberships.business')
            ->when($validated['search'] ?? null, function ($query, $search): void {
                $query->where(fn ($inner) => $inner
                    ->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%'])
                    ->orWhereRaw('LOWER(email) LIKE ?', ['%'.mb_strtolower($search).'%'])
                    ->orWhereHas('memberships.business', fn ($businessQuery) => $businessQuery
                        ->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%'])));
            })
            ->when(array_key_exists('isActive', $validated), fn ($query) => $query->where('is_active', $request->boolean('isActive')))
            ->when(($validated['access'] ?? null) === 'SUPER_ADMIN', fn ($query) => $query->where('platform_role', Role::SuperAdmin->value))
            ->when(($validated['access'] ?? null) === 'TENANT', fn ($query) => $query->whereNull('platform_role'))
            ->when(
                $validated['membershipRole'] ?? null,
                fn ($query, $role) => $query->whereHas('memberships', fn ($membershipQuery) => $membershipQuery->where('role', $role))
            )
            ->withCount('memberships');

        match ($sort) {
            'fullName' => $query->orderBy('users.name', $direction),
            'email' => $query->orderBy('users.email', $direction),
            'access' => $query->orderBy('users.platform_role', $direction),
            'membershipsCount' => $query->orderBy('memberships_count', $direction),
            'isActive' => $query->orderBy('users.is_active', $direction),
            default => $query->orderBy('users.created_at', $direction),
        };

        $users = $query
            ->orderBy('users.id', $direction)
            ->paginate($validated['perPage'] ?? 10);

        return response()->json([
            'data' => $users->getCollection()->map(fn (User $user) => SaasPayload::user($user))->all(),
            'meta' => [
                'currentPage' => $users->currentPage(),
                'lastPage' => $users->lastPage(),
                'perPage' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate(['isActive' => ['required', 'boolean']]);
        $isActive = $validated['isActive'];
        if ($request->user()->is($user) && ! $isActive) {
            return response()->json(['code' => 'SELF_DEACTIVATION_FORBIDDEN', 'message' => 'You cannot deactivate your own account.'], 409);
        }
        if (! $isActive && $user->platform_role === Role::SuperAdmin && User::query()
            ->where('platform_role', Role::SuperAdmin->value)
            ->where('is_active', true)
            ->count() <= 1) {
            return response()->json(['code' => 'LAST_SUPER_ADMIN', 'message' => 'The last active Super Admin cannot be deactivated.'], 409);
        }

        DB::transaction(function () use ($request, $user, $isActive): void {
            $user->update(['is_active' => $isActive]);
            if (! $isActive) {
                $this->tokens->revokeUserSessions($user->getKey());
            }
            $this->audit->record('user.status_changed', $request, $request->user(), null, User::class, $user->getKey(), ['is_active' => $isActive]);
        });

        return response()->json(['user' => SaasPayload::user($user->fresh('memberships.business'))]);
    }
}
