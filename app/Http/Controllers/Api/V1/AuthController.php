<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BusinessStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Models\AccessToken;
use App\Models\Business;
use App\Models\Membership;
use App\Models\RefreshToken;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\AuthTokenService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthTokenService $tokens,
        private readonly AuditLogger $audit,
    ) {}

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'businessId' => ['nullable', 'integer'],
        ]);

        $user = User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower(trim($validated['email']))])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'code' => 'INVALID_CREDENTIALS',
                'message' => 'The email or password is incorrect.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'code' => 'ACCOUNT_INACTIVE',
                'message' => 'This account is inactive.',
            ], 403);
        }

        $membership = null;
        if ($user->platform_role !== Role::SuperAdmin) {
            $memberships = $user->memberships()
                ->with('business.subscription.plan.entitlements')
                ->where('is_active', true)
                ->whereHas('business', fn ($query) => $query->where('status', BusinessStatus::Active->value))
                ->get();

            if ($request->header('X-Client-Platform') === 'mobile') {
                $memberships = $memberships
                    ->filter(fn (Membership $item): bool => $item->role === Role::Customer
                        && $this->customerOrderingEnabled($item->business))
                    ->values();
            }

            $isWebClient = $request->header('X-Client') === 'ordersync-web';
            if ($isWebClient && $memberships->isNotEmpty() && $memberships->every(
                fn (Membership $item): bool => $item->role === Role::Customer
            )) {
                return $this->customerAppRequiredResponse();
            }

            if (array_key_exists('businessId', $validated) && $validated['businessId'] !== null) {
                $membership = $memberships->firstWhere('business_id', $validated['businessId']);
                if (! $membership) {
                    return response()->json([
                        'code' => 'BUSINESS_ACCESS_DENIED',
                        'message' => 'No active membership exists for the selected business.',
                    ], 403);
                }
            } elseif ($memberships->count() === 1) {
                $membership = $memberships->first();
            } elseif ($memberships->isEmpty()) {
                return response()->json([
                    'code' => $request->header('X-Client-Platform') === 'mobile' ? 'NO_AVAILABLE_STOREFRONT' : 'NO_ACTIVE_MEMBERSHIP',
                    'message' => $request->header('X-Client-Platform') === 'mobile'
                        ? 'No store is available for this customer account. Choose a store that offers customer ordering.'
                        : 'This account has no active business membership.',
                ], 403);
            } else {
                return response()->json([
                    'code' => 'BUSINESS_SELECTION_REQUIRED',
                    'message' => 'Select a business to continue.',
                    'businesses' => $this->membershipSummaries($memberships),
                ], 409);
            }

            if ($isWebClient && $membership?->role === Role::Customer) {
                return $this->customerAppRequiredResponse();
            }
        }

        $pair = $this->tokens->issue($user, $membership, $request);
        $business = $membership?->business;
        $this->audit->record('auth.login', $request, $user, $business, User::class, $user->getKey());

        return $this->sessionResponse($request, $user, $membership, $pair);
    }

    private function customerAppRequiredResponse(): JsonResponse
    {
        return response()->json([
            'code' => 'CUSTOMER_APP_REQUIRED',
            'message' => 'Customer accounts must sign in through the OrderSync mobile app.',
        ], 403);
    }

    public function registerCustomer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fullName' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', Password::min(12)->letters()->numbers()],
            'businessId' => ['required', 'integer'],
        ]);

        $business = Business::query()
            ->with('subscription.plan.entitlements')
            ->whereKey($validated['businessId'])
            ->where('status', BusinessStatus::Active->value)
            ->first();
        if (! $business || ! $this->customerOrderingEnabled($business)) {
            return response()->json([
                'code' => 'STORE_UNAVAILABLE',
                'message' => 'This store is not available for customer registration.',
            ], 422);
        }

        $email = mb_strtolower(trim($validated['email']));
        try {
            [$user, $membership, $pair] = DB::transaction(function () use ($validated, $email, $business, $request): array {
                $user = User::query()->create([
                    'name' => trim($validated['fullName']),
                    'email' => $email,
                    'password' => $validated['password'],
                    'is_active' => true,
                ]);
                $membership = Membership::query()->create([
                    'business_id' => $business->getKey(),
                    'user_id' => $user->getKey(),
                    'role' => Role::Customer,
                    'is_active' => true,
                ]);
                $membership->setRelation('business', $business);

                return [$user, $membership, $this->tokens->issue($user, $membership, $request)];
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'code' => 'EMAIL_ALREADY_REGISTERED',
                'message' => 'This email already has an OrderSync account. Sign in instead.',
                'errors' => ['email' => ['This email already has an OrderSync account.']],
            ], 422);
        }

        $this->audit->record('auth.customer_registered', $request, $user, $business, User::class, $user->getKey());

        return $this->sessionResponse($request, $user, $membership, $pair)->setStatusCode(201);
    }

    public function refresh(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refreshToken' => ['nullable', 'string', 'max:255'],
        ]);
        $plainRefreshToken = $validated['refreshToken'] ?? $request->cookie(config('auth_tokens.refresh_cookie'));

        if (! $plainRefreshToken || ! ($pair = $this->tokens->rotate($plainRefreshToken, $request))) {
            return response()->json([
                'code' => 'INVALID_REFRESH_TOKEN',
                'message' => 'The refresh token is missing, expired, or invalid.',
            ], 401)->withCookie($this->forgetRefreshCookie());
        }

        $accessToken = $pair['accessTokenModel'];
        $user = $accessToken->user;
        $membership = $accessToken->business_id === null
            ? null
            : Membership::query()->with('business')->where('user_id', $user->getKey())->where('business_id', $accessToken->business_id)->first();

        $this->audit->record('auth.refresh', $request, $user, $membership?->business, User::class, $user->getKey());

        return $this->sessionResponse($request, $user, $membership, $pair);
    }

    public function logout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refreshToken' => ['nullable', 'string', 'max:255'],
        ]);
        /** @var AccessToken $accessToken */
        $accessToken = $request->attributes->get('accessToken');
        $plainRefreshToken = $validated['refreshToken'] ?? $request->cookie(config('auth_tokens.refresh_cookie'));
        $user = $request->user();
        $business = $request->attributes->get('currentBusiness');

        $this->tokens->revokeAccessToken($accessToken);
        $this->tokens->revokeRefreshToken($plainRefreshToken);
        $this->audit->record('auth.logout', $request, $user, $business, User::class, $user->getKey());

        return response()->json(null, 204)->withCookie($this->forgetRefreshCookie());
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userPayload(
            $request->user(),
            $request->attributes->get('currentMembership'),
        ));
    }

    public function businesses(Request $request): JsonResponse
    {
        $memberships = $request->user()->memberships()
            ->with('business')
            ->where('is_active', true)
            ->whereHas('business', fn ($query) => $query->where('status', BusinessStatus::Active->value))
            ->get();

        return response()->json(['businesses' => $this->membershipSummaries($memberships)]);
    }

    public function switchBusiness(Request $request): JsonResponse
    {
        $validated = $request->validate(['businessId' => ['required', 'integer']]);
        $user = $request->user();
        $membership = $user->memberships()
            ->with('business')
            ->where('business_id', $validated['businessId'])
            ->where('is_active', true)
            ->whereHas('business', fn ($query) => $query->where('status', BusinessStatus::Active->value))
            ->first();

        if (! $membership) {
            return response()->json([
                'code' => 'BUSINESS_ACCESS_DENIED',
                'message' => 'No active membership exists for the selected business.',
            ], 403);
        }

        /** @var AccessToken $currentAccessToken */
        $currentAccessToken = $request->attributes->get('accessToken');
        $this->tokens->revokeAccessToken($currentAccessToken);
        $pair = $this->tokens->issue($user, $membership, $request);
        $this->audit->record(
            'auth.business_switched',
            $request,
            $user,
            $membership->business,
            User::class,
            $user->getKey(),
            ['previous_business_id' => $currentAccessToken->business_id],
        );

        return $this->sessionResponse($request, $user, $membership, $pair);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', Password::min(12)->letters()->numbers()],
        ]);
        $user = $request->user();

        if (! Hash::check($validated['currentPassword'], $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect.',
                'errors' => ['currentPassword' => ['The current password is incorrect.']],
            ], 422);
        }

        $user->update(['password' => $validated['newPassword']]);
        $this->tokens->revokeOtherSessions(
            $user,
            $request->attributes->get('accessToken'),
            $request->cookie(config('auth_tokens.refresh_cookie')),
        );
        $this->audit->record(
            'auth.password_changed',
            $request,
            $user,
            $request->attributes->get('currentBusiness'),
            User::class,
            $user->getKey(),
        );

        return response()->json(null, 204);
    }

    /**
     * @param  array{accessToken: string, accessTokenModel: AccessToken, refreshToken: string, refreshTokenModel: RefreshToken}  $pair
     */
    private function sessionResponse(Request $request, User $user, ?Membership $membership, array $pair): JsonResponse
    {
        $payload = [
            'accessToken' => $pair['accessToken'],
            'accessExpiresAt' => $pair['accessTokenModel']->expires_at->toIso8601String(),
            'user' => $this->userPayload($user, $membership),
        ];

        if ($request->header('X-Client-Platform') === 'mobile') {
            $payload['refreshToken'] = $pair['refreshToken'];
            $payload['refreshExpiresAt'] = $pair['refreshTokenModel']->expires_at->toIso8601String();
        }

        $minutes = (int) config('auth_tokens.refresh_token_minutes');
        $cookie = cookie(
            (string) config('auth_tokens.refresh_cookie'),
            $pair['refreshToken'],
            $minutes,
            (string) config('auth_tokens.refresh_cookie_path'),
            null,
            (bool) config('auth_tokens.refresh_cookie_secure'),
            true,
            false,
            (string) config('auth_tokens.refresh_cookie_same_site'),
        );

        return response()->json($payload)->withCookie($cookie);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user, ?Membership $membership): array
    {
        $user->loadMissing('customerProfile');
        $memberships = $user->memberships()
            ->with('business')
            ->where('is_active', true)
            ->whereHas('business', fn ($query) => $query->where('status', BusinessStatus::Active->value))
            ->get();
        $role = $membership?->role ?? $user->platform_role;

        return [
            'id' => (string) $user->getKey(),
            'email' => $user->email,
            'fullName' => $user->name,
            'phone' => $user->customerProfile?->phone ?? '',
            'avatarUrl' => $user->customerProfile?->avatar_path
                ? Storage::disk('public')->url($user->customerProfile->avatar_path)
                : null,
            'role' => $role?->value,
            'isActive' => $user->is_active,
            'createdAt' => $user->created_at?->toIso8601String(),
            'business' => $membership ? [
                'id' => (string) $membership->business->getKey(),
                'name' => $membership->business->name,
                'slug' => $membership->business->slug,
            ] : null,
            'memberships' => $this->membershipSummaries($memberships),
        ];
    }

    /**
     * @param  iterable<int, Membership>  $memberships
     * @return array<int, array<string, mixed>>
     */
    private function membershipSummaries(iterable $memberships): array
    {
        $summaries = [];
        foreach ($memberships as $membership) {
            $summaries[] = [
                'businessId' => (string) $membership->business->getKey(),
                'businessName' => $membership->business->name,
                'businessSlug' => $membership->business->slug,
                'role' => $membership->role->value,
            ];
        }

        return $summaries;
    }

    private function forgetRefreshCookie(): \Symfony\Component\HttpFoundation\Cookie
    {
        return Cookie::forget(
            (string) config('auth_tokens.refresh_cookie'),
            (string) config('auth_tokens.refresh_cookie_path'),
        );
    }

    private function customerOrderingEnabled(Business $business): bool
    {
        if ($business->status !== BusinessStatus::Active) {
            return false;
        }

        $subscription = $business->subscription;
        if (! $subscription
            || ! in_array($subscription->effectiveStatus(), [SubscriptionStatus::Active, SubscriptionStatus::Grace], true)) {
            return false;
        }

        return $subscription->plan->entitlements
            ->firstWhere('key', 'customer_ordering_enabled')?->pivot->value === 'true';
    }
}
