<?php

namespace Tests\Feature\Api;

use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\Membership;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\AuthTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_member_can_login_refresh_and_logout_with_rotating_hashed_tokens(): void
    {
        [$user, $business] = $this->createMember(Role::BusinessOwner);

        $login = $this->withHeader('X-Client', 'ordersync-web')->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $login->assertOk()
            ->assertJsonPath('user.role', Role::BusinessOwner->value)
            ->assertJsonPath('user.business.id', (string) $business->getKey())
            ->assertJsonMissingPath('refreshToken');

        $accessToken = $login->json('accessToken');
        $refreshCookie = $login->getCookie(config('auth_tokens.refresh_cookie'), false);
        $this->assertNotNull($refreshCookie);
        $this->assertTrue($refreshCookie->isHttpOnly());
        $this->assertDatabaseHas('access_tokens', ['token_hash' => AuthTokenService::hash($accessToken)]);
        $this->assertDatabaseMissing('access_tokens', ['token_hash' => $accessToken]);

        $oldRefreshHash = AuthTokenService::hash($refreshCookie->getValue());
        $refresh = $this->withCredentials()
            ->withUnencryptedCookie(config('auth_tokens.refresh_cookie'), $refreshCookie->getValue())
            ->postJson('/api/v1/auth/refresh');

        $refresh->assertOk()->assertJsonPath('user.role', Role::BusinessOwner->value);
        $this->assertDatabaseHas('refresh_tokens', [
            'token_hash' => $oldRefreshHash,
            'revoked_at' => now(),
        ]);
        $this->assertNotSame($accessToken, $refresh->json('accessToken'));

        $newAccessToken = $refresh->json('accessToken');
        $newRefreshCookie = $refresh->getCookie(config('auth_tokens.refresh_cookie'), false);
        $logout = $this->withCredentials()
            ->withToken($newAccessToken)
            ->withUnencryptedCookie(config('auth_tokens.refresh_cookie'), $newRefreshCookie->getValue())
            ->postJson('/api/v1/auth/logout');

        $logout->assertNoContent();
        $this->withToken($newAccessToken)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->assertDatabaseCount('audit_logs', 3);
        $this->assertSame(
            ['auth.login', 'auth.refresh', 'auth.logout'],
            AuditLog::query()->orderBy('id')->pluck('action')->all(),
        );
    }

    public function test_mobile_login_returns_rotating_refresh_token_in_response_body(): void
    {
        [$user, $business] = $this->createMember(Role::Customer);
        $business->subscription()->create([
            'subscription_plan_id' => SubscriptionPlan::query()->where('code', 'STANDARD')->firstOrFail()->getKey(),
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
        ]);

        $login = $this->withHeaders([
            'X-Client' => 'ordersync-android',
            'X-Client-Platform' => 'mobile',
        ])->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $login->assertOk()
            ->assertJsonPath('user.role', Role::Customer->value)
            ->assertJsonStructure(['accessToken', 'accessExpiresAt', 'refreshToken', 'refreshExpiresAt']);

        $refresh = $this->withHeaders([
            'X-Client' => 'ordersync-android',
            'X-Client-Platform' => 'mobile',
        ])->postJson('/api/v1/auth/refresh', ['refreshToken' => $login->json('refreshToken')]);

        $refresh->assertOk()->assertJsonStructure(['accessToken', 'refreshToken']);
        $this->assertNotSame($login->json('refreshToken'), $refresh->json('refreshToken'));
    }

    public function test_customer_web_login_is_redirected_to_the_mobile_app_without_issuing_tokens(): void
    {
        [$customer] = $this->createMember(Role::Customer);

        $this->withHeader('X-Client', 'ordersync-web')
            ->postJson('/api/v1/auth/login', [
                'email' => $customer->email,
                'password' => 'password',
            ])
            ->assertForbidden()
            ->assertJsonPath('code', 'CUSTOMER_APP_REQUIRED')
            ->assertJsonPath('message', 'Customer accounts must sign in through the OrderSync mobile app.');

        $this->assertDatabaseCount('access_tokens', 0);
        $this->assertDatabaseCount('refresh_tokens', 0);
    }

    public function test_invalid_inactive_and_membershipless_accounts_cannot_login(): void
    {
        [$user] = $this->createMember(Role::Cashier);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertUnauthorized()
            ->assertJsonPath('code', 'INVALID_CREDENTIALS')
            ->assertJsonPath('message', 'The email or password is incorrect.');

        $user->update(['is_active' => false]);
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertForbidden()->assertJsonPath('code', 'ACCOUNT_INACTIVE');

        $membershipless = User::factory()->create();
        $this->postJson('/api/v1/auth/login', [
            'email' => $membershipless->email,
            'password' => 'password',
        ])->assertForbidden()->assertJsonPath('code', 'NO_ACTIVE_MEMBERSHIP');
    }

    public function test_multiple_business_memberships_require_an_explicit_selection(): void
    {
        [$user] = $this->createMember(Role::BusinessOwner);
        $secondBusiness = Business::create(['name' => 'Second Store', 'slug' => 'second-store']);
        Membership::create([
            'business_id' => $secondBusiness->getKey(),
            'user_id' => $user->getKey(),
            'role' => Role::Staff,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(409)
            ->assertJsonPath('code', 'BUSINESS_SELECTION_REQUIRED')
            ->assertJsonCount(2, 'businesses');

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'businessId' => $secondBusiness->getKey(),
        ])->assertOk()
            ->assertJsonPath('user.role', Role::Staff->value)
            ->assertJsonPath('user.business.id', (string) $secondBusiness->getKey());
    }

    public function test_refresh_tokens_are_single_use(): void
    {
        [$user] = $this->createMember(Role::Cashier);
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $refreshToken = $login->getCookie(config('auth_tokens.refresh_cookie'), false)->getValue();

        $this->withCredentials()
            ->withUnencryptedCookie(config('auth_tokens.refresh_cookie'), $refreshToken)
            ->postJson('/api/v1/auth/refresh')
            ->assertOk();
        $this->withCredentials()
            ->withUnencryptedCookie(config('auth_tokens.refresh_cookie'), $refreshToken)
            ->postJson('/api/v1/auth/refresh')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'INVALID_REFRESH_TOKEN');
    }

    public function test_password_change_requires_current_password_and_revokes_other_sessions(): void
    {
        [$user] = $this->createMember(Role::BusinessOwner);
        $firstLogin = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $secondLogin = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->withToken($secondLogin->json('accessToken'))
            ->postJson('/api/v1/auth/change-password', [
                'currentPassword' => 'incorrect',
                'newPassword' => 'NewPassword123',
            ])->assertUnprocessable();

        $secondRefresh = $secondLogin->getCookie(config('auth_tokens.refresh_cookie'), false)->getValue();
        $this->withCredentials()
            ->withToken($secondLogin->json('accessToken'))
            ->withUnencryptedCookie(config('auth_tokens.refresh_cookie'), $secondRefresh)
            ->postJson('/api/v1/auth/change-password', [
                'currentPassword' => 'password',
                'newPassword' => 'NewPassword123',
            ])->assertNoContent();

        $this->withToken($firstLogin->json('accessToken'))->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->withToken($secondLogin->json('accessToken'))->getJson('/api/v1/auth/me')->assertOk();
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertUnauthorized();
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'NewPassword123',
        ])->assertOk();
        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.password_changed']);
    }

    /**
     * @return array{User, Business, Membership}
     */
    private function createMember(Role $role): array
    {
        $user = User::factory()->create();
        $business = Business::create([
            'name' => 'Tonette Mini Grocery',
            'slug' => 'tonette-mini-grocery-'.fake()->unique()->numberBetween(1, 100000),
        ]);
        $membership = Membership::create([
            'business_id' => $business->getKey(),
            'user_id' => $user->getKey(),
            'role' => $role,
        ]);

        return [$user, $business, $membership];
    }
}
