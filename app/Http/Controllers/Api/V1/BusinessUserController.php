<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Membership;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\AuthTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class BusinessUserController extends Controller
{
    public function __construct(
        private readonly AuthTokenService $tokens,
        private readonly AuditLogger $audit,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $memberships = Membership::query()
            ->with('user')
            ->where('business_id', $business->getKey())
            ->whereIn('role', $this->managedRoles())
            ->latest('id')
            ->get();

        return response()->json([
            'items' => $memberships->map(fn (Membership $membership): array => $this->payload($membership, $business))->all(),
        ]);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $business = $this->business($request);
        $membership = $this->membership($business, $user);

        return response()->json($this->payload($membership, $business));
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'fullName' => trim((string) $request->input('fullName')),
            'email' => mb_strtolower(trim((string) $request->input('email'))),
        ]);
        $validated = $request->validate([
            'fullName' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'role' => ['required', Rule::in([Role::Staff->value, Role::Cashier->value])],
            'isActive' => ['sometimes', 'boolean'],
            'password' => ['required', 'string', Password::min(12)->letters()->numbers()],
        ]);
        $business = $this->business($request);

        return DB::transaction(function () use ($request, $validated, $business): JsonResponse {
            $lockedBusiness = Business::query()->whereKey($business->getKey())->lockForUpdate()->firstOrFail();
            $isActive = $validated['isActive'] ?? true;
            if ($isActive && $this->activeManagedUserCount($lockedBusiness) >= $this->maxUsers($lockedBusiness)) {
                return response()->json([
                    'code' => 'USER_LIMIT_REACHED',
                    'message' => 'The active-user limit for the current subscription has been reached.',
                ], 409);
            }

            $user = User::create([
                'name' => $validated['fullName'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'is_active' => true,
                'platform_role' => null,
            ]);
            $membership = Membership::create([
                'business_id' => $lockedBusiness->getKey(),
                'user_id' => $user->getKey(),
                'role' => $validated['role'],
                'is_active' => $isActive,
            ]);
            $membership->setRelation('user', $user);

            $this->audit->record(
                'business_user.created',
                $request,
                $request->user(),
                $lockedBusiness,
                User::class,
                $user->getKey(),
                ['role' => $validated['role'], 'is_active' => $isActive],
            );

            return response()->json($this->payload($membership, $lockedBusiness), 201);
        });
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if ($request->has('email')) {
            $request->merge(['email' => mb_strtolower(trim((string) $request->input('email')))]);
        }
        if ($request->has('fullName')) {
            $request->merge(['fullName' => trim((string) $request->input('fullName'))]);
        }
        $validated = $request->validate([
            'fullName' => ['sometimes', 'required', 'string', 'min:2', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'role' => ['sometimes', Rule::in($this->managedRoles())],
            'isActive' => ['sometimes', 'boolean'],
        ]);
        $business = $this->business($request);

        return DB::transaction(function () use ($request, $user, $validated, $business): JsonResponse {
            $lockedBusiness = Business::query()->whereKey($business->getKey())->lockForUpdate()->firstOrFail();
            $membership = $this->membership($lockedBusiness, $user, true);
            $isSelf = $request->user()->is($user);
            $newRole = isset($validated['role']) ? Role::from($validated['role']) : $membership->role;
            $newActive = $validated['isActive'] ?? $membership->is_active;

            if ($membership->role === Role::BusinessOwner && $newRole !== Role::BusinessOwner) {
                return response()->json([
                    'code' => 'SELF_DEMOTE',
                    'message' => 'The business owner role cannot be changed from this screen.',
                ], 403);
            }
            if ($membership->role !== Role::BusinessOwner && $newRole === Role::BusinessOwner) {
                return response()->json([
                    'code' => 'OWNER_PROMOTION_FORBIDDEN',
                    'message' => 'Staff and cashiers cannot be promoted to business owner from this screen.',
                ], 403);
            }
            if ($isSelf && ! $newActive) {
                return response()->json([
                    'code' => 'SELF_DEACTIVATE',
                    'message' => 'You cannot deactivate your own business membership.',
                ], 403);
            }
            if (! $membership->is_active && $newActive && $this->activeManagedUserCount($lockedBusiness) >= $this->maxUsers($lockedBusiness)) {
                return response()->json([
                    'code' => 'USER_LIMIT_REACHED',
                    'message' => 'The active-user limit for the current subscription has been reached.',
                ], 409);
            }

            $identityChanged = (isset($validated['fullName']) && $validated['fullName'] !== $user->name)
                || (isset($validated['email']) && $validated['email'] !== $user->email);
            if ($identityChanged && $user->memberships()->where('business_id', '!=', $lockedBusiness->getKey())->exists()) {
                return response()->json([
                    'code' => 'SHARED_ACCOUNT_IDENTITY',
                    'message' => 'This account belongs to more than one business. Its name and email must be changed by the account holder.',
                ], 409);
            }

            $user->update(array_filter([
                'name' => $validated['fullName'] ?? null,
                'email' => $validated['email'] ?? null,
            ], fn ($value): bool => $value !== null));
            $membership->update([
                'role' => $newRole,
                'is_active' => $newActive,
            ]);
            if (! $newActive) {
                $this->tokens->revokeUserBusinessSessions($user->getKey(), $lockedBusiness->getKey());
            }

            $this->audit->record(
                'business_user.updated',
                $request,
                $request->user(),
                $lockedBusiness,
                User::class,
                $user->getKey(),
                ['role' => $newRole->value, 'is_active' => $newActive],
            );

            return response()->json($this->payload($membership->fresh('user'), $lockedBusiness));
        });
    }

    public function deactivate(Request $request, User $user): JsonResponse
    {
        $business = $this->business($request);

        return DB::transaction(function () use ($request, $user, $business): JsonResponse {
            $membership = $this->membership($business, $user, true);
            if ($request->user()->is($user)) {
                return response()->json([
                    'code' => 'SELF_DEACTIVATE',
                    'message' => 'You cannot deactivate your own business membership.',
                ], 403);
            }
            if ($membership->role === Role::BusinessOwner) {
                return response()->json([
                    'code' => 'OWNER_DEACTIVATION_FORBIDDEN',
                    'message' => 'A business owner cannot be deactivated from this screen.',
                ], 403);
            }

            $membership->update(['is_active' => false]);
            $this->tokens->revokeUserBusinessSessions($user->getKey(), $business->getKey());
            $this->audit->record(
                'business_user.deactivated',
                $request,
                $request->user(),
                $business,
                User::class,
                $user->getKey(),
                ['role' => $membership->role->value],
            );

            return response()->json($this->payload($membership->fresh('user'), $business));
        });
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $business = $this->business($request);
        $this->membership($business, $user);

        if ($request->user()->is($user)) {
            return response()->json([
                'code' => 'SELF_PASSWORD_RESET_FORBIDDEN',
                'message' => 'Use Change password to update your own password.',
            ], 403);
        }
        if ($user->memberships()->where('business_id', '!=', $business->getKey())->exists()) {
            return response()->json([
                'code' => 'SHARED_ACCOUNT_PASSWORD_RESET_FORBIDDEN',
                'message' => 'This account belongs to more than one business and must reset its own password.',
            ], 409);
        }

        $temporaryPassword = 'Tmp9'.Str::random(12);
        DB::transaction(function () use ($request, $user, $business, $temporaryPassword): void {
            $user->update(['password' => $temporaryPassword]);
            $this->tokens->revokeUserSessions($user->getKey());
            $this->audit->record(
                'business_user.password_reset',
                $request,
                $request->user(),
                $business,
                User::class,
                $user->getKey(),
            );
        });

        return response()->json(['tempPassword' => $temporaryPassword]);
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }

    private function membership(Business $business, User $user, bool $lock = false): Membership
    {
        $query = Membership::query()
            ->with('user')
            ->where('business_id', $business->getKey())
            ->where('user_id', $user->getKey())
            ->whereIn('role', $this->managedRoles());

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->firstOrFail();
    }

    /** @return list<string> */
    private function managedRoles(): array
    {
        return [Role::BusinessOwner->value, Role::Staff->value, Role::Cashier->value];
    }

    private function activeManagedUserCount(Business $business): int
    {
        return Membership::query()
            ->where('business_id', $business->getKey())
            ->where('is_active', true)
            ->whereIn('role', $this->managedRoles())
            ->count();
    }

    private function maxUsers(Business $business): int
    {
        $subscription = $business->subscription()->with('plan.entitlements')->first();
        $entitlement = $subscription?->plan?->entitlements->firstWhere('key', 'max_users');

        return max(1, (int) ($entitlement?->pivot?->value ?? 1));
    }

    /** @return array<string, mixed> */
    private function payload(Membership $membership, Business $business): array
    {
        $user = $membership->user;

        return [
            'id' => (string) $user->getKey(),
            'email' => $user->email,
            'fullName' => $user->name,
            'role' => $membership->role->value,
            'isActive' => $user->is_active && $membership->is_active,
            'createdAt' => $user->created_at?->toIso8601String(),
            'business' => [
                'id' => (string) $business->getKey(),
                'name' => $business->name,
                'slug' => $business->slug,
            ],
            'memberships' => [[
                'businessId' => (string) $business->getKey(),
                'businessName' => $business->name,
                'businessSlug' => $business->slug,
                'role' => $membership->role->value,
            ]],
        ];
    }
}
