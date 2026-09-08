<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use App\Models\AccessToken;
use App\Models\Membership;
use App\Services\AuthTokenService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateAccessToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainToken = $request->bearerToken();
        if (! $plainToken) {
            return $this->unauthorized();
        }

        $accessToken = AccessToken::query()
            ->with(['user', 'business'])
            ->where('token_hash', AuthTokenService::hash($plainToken))
            ->first();

        if (! $accessToken || $accessToken->revoked_at || $accessToken->expires_at->isPast()) {
            return $this->unauthorized();
        }

        $user = $accessToken->user;
        if (! $user || ! $user->is_active) {
            return $this->unauthorized();
        }

        $membership = null;
        $role = $user->platform_role;
        if ($accessToken->business_id !== null) {
            $membership = Membership::query()
                ->where('business_id', $accessToken->business_id)
                ->where('user_id', $user->getKey())
                ->where('is_active', true)
                ->first();

            if (! $membership) {
                return $this->unauthorized();
            }

            $role = $membership->role;
        } elseif ($role !== Role::SuperAdmin) {
            return $this->unauthorized();
        }

        $accessToken->forceFill(['last_used_at' => now()])->save();
        $request->setUserResolver(fn () => $user);
        $request->attributes->set('accessToken', $accessToken);
        $request->attributes->set('currentBusiness', $accessToken->business);
        $request->attributes->set('currentMembership', $membership);
        $request->attributes->set('currentRole', $role);

        return $next($request);
    }

    private function unauthorized(): JsonResponse
    {
        return response()->json([
            'code' => 'UNAUTHORIZED',
            'message' => 'Authentication is required.',
        ], 401);
    }
}
