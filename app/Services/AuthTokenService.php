<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\AccessToken;
use App\Models\Membership;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthTokenService
{
    /**
     * @return array{accessToken: string, accessTokenModel: AccessToken, refreshToken: string, refreshTokenModel: RefreshToken}
     */
    public function issue(User $user, ?Membership $membership, Request $request): array
    {
        return DB::transaction(fn () => $this->createPair($user, $membership, $request));
    }

    /**
     * @return array{accessToken: string, accessTokenModel: AccessToken, refreshToken: string, refreshTokenModel: RefreshToken}|null
     */
    public function rotate(string $plainRefreshToken, Request $request): ?array
    {
        return DB::transaction(function () use ($plainRefreshToken, $request): ?array {
            $refreshToken = RefreshToken::query()
                ->where('token_hash', self::hash($plainRefreshToken))
                ->lockForUpdate()
                ->first();

            if (! $refreshToken || $refreshToken->revoked_at || $refreshToken->expires_at->isPast()) {
                return null;
            }

            $user = $refreshToken->user;
            if (! $user || ! $user->is_active) {
                $refreshToken->update(['revoked_at' => now()]);

                return null;
            }

            $membership = null;
            if ($refreshToken->business_id !== null) {
                $membership = Membership::query()
                    ->where('user_id', $user->getKey())
                    ->where('business_id', $refreshToken->business_id)
                    ->where('is_active', true)
                    ->first();

                if (! $membership) {
                    $refreshToken->update(['revoked_at' => now()]);

                    return null;
                }
            } elseif ($user->platform_role !== Role::SuperAdmin) {
                $refreshToken->update(['revoked_at' => now()]);

                return null;
            }

            $pair = $this->createPair($user, $membership, $request);
            $refreshToken->update([
                'revoked_at' => now(),
                'replaced_by_id' => $pair['refreshTokenModel']->getKey(),
            ]);

            return $pair;
        });
    }

    public function revokeAccessToken(AccessToken $accessToken): void
    {
        if ($accessToken->revoked_at === null) {
            $accessToken->update(['revoked_at' => now()]);
        }
    }

    public function revokeRefreshToken(?string $plainRefreshToken): void
    {
        if (! $plainRefreshToken) {
            return;
        }

        RefreshToken::query()
            ->where('token_hash', self::hash($plainRefreshToken))
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    public function revokeOtherSessions(
        User $user,
        AccessToken $currentAccessToken,
        ?string $currentPlainRefreshToken,
    ): void {
        DB::transaction(function () use ($user, $currentAccessToken, $currentPlainRefreshToken): void {
            AccessToken::query()
                ->where('user_id', $user->getKey())
                ->where('id', '!=', $currentAccessToken->getKey())
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $refreshTokens = RefreshToken::query()
                ->where('user_id', $user->getKey())
                ->whereNull('revoked_at');

            if ($currentPlainRefreshToken) {
                $refreshTokens->where('token_hash', '!=', self::hash($currentPlainRefreshToken));
            }

            $refreshTokens->update(['revoked_at' => now()]);
        });
    }

    public static function hash(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }

    /**
     * @return array{accessToken: string, accessTokenModel: AccessToken, refreshToken: string, refreshTokenModel: RefreshToken}
     */
    private function createPair(User $user, ?Membership $membership, Request $request): array
    {
        $plainAccessToken = Str::random(80);
        $plainRefreshToken = Str::random(80);
        $clientName = mb_substr((string) $request->header('X-Client', 'unknown'), 0, 64);

        $accessToken = AccessToken::create([
            'id' => (string) Str::uuid(),
            'token_hash' => self::hash($plainAccessToken),
            'user_id' => $user->getKey(),
            'business_id' => $membership?->business_id,
            'expires_at' => now()->addMinutes((int) config('auth_tokens.access_token_minutes')),
            'client_name' => $clientName,
        ]);

        $refreshToken = RefreshToken::create([
            'id' => (string) Str::uuid(),
            'token_hash' => self::hash($plainRefreshToken),
            'user_id' => $user->getKey(),
            'business_id' => $membership?->business_id,
            'expires_at' => now()->addMinutes((int) config('auth_tokens.refresh_token_minutes')),
            'client_name' => $clientName,
        ]);

        return [
            'accessToken' => $plainAccessToken,
            'accessTokenModel' => $accessToken,
            'refreshToken' => $plainRefreshToken,
            'refreshTokenModel' => $refreshToken,
        ];
    }
}
