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
            'isActive' => ['nullable', 'boolean'],
        ]);
        $users = User::query()
            ->with('memberships.business')
            ->when($validated['search'] ?? null, function ($query, $search): void {
                $query->where(fn ($inner) => $inner
                    ->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%'])
                    ->orWhereRaw('LOWER(email) LIKE ?', ['%'.mb_strtolower($search).'%']));
            })
            ->when(array_key_exists('isActive', $validated), fn ($query) => $query->where('is_active', $validated['isActive']))
            ->latest('id')
            ->paginate(50);

        return response()->json([
            'data' => $users->getCollection()->map(fn (User $user) => SaasPayload::user($user))->all(),
            'meta' => ['currentPage' => $users->currentPage(), 'lastPage' => $users->lastPage(), 'total' => $users->total()],
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
