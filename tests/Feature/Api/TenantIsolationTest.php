<?php

namespace Tests\Feature\Api;

use App\Enums\Role;
use App\Models\AccessToken;
use App\Models\Business;
use App\Models\Membership;
use App\Models\User;
use App\Services\AuthTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_access_token_is_bound_to_one_business_and_rejects_header_override(): void
    {
        $user = User::factory()->create();
        $businessA = Business::create(['name' => 'Store A', 'slug' => 'store-a']);
        $businessB = Business::create(['name' => 'Store B', 'slug' => 'store-b']);
        Membership::create([
            'business_id' => $businessA->getKey(),
            'user_id' => $user->getKey(),
            'role' => Role::BusinessOwner,
        ]);
        Membership::create([
            'business_id' => $businessB->getKey(),
            'user_id' => $user->getKey(),
            'role' => Role::Staff,
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'businessId' => $businessA->getKey(),
        ])->assertOk();

        $storedAccessToken = AccessToken::query()
            ->where('token_hash', AuthTokenService::hash($login->json('accessToken')))
            ->first();
        $this->assertNotNull($storedAccessToken);
        $this->assertFalse(
            $storedAccessToken->expires_at->isPast(),
            'Token expiry '.$storedAccessToken->expires_at->toIso8601String().' is not after '.now()->toIso8601String(),
        );
        $this->assertSame($businessA->getKey(), $storedAccessToken->business_id);
        $this->assertTrue(Membership::query()
            ->where('business_id', $storedAccessToken->business_id)
            ->where('user_id', $user->getKey())
            ->where('is_active', true)
            ->exists());

        $this->withToken($login->json('accessToken'))
            ->getJson('/api/v1/tenant/context')
            ->assertOk()
            ->assertJsonPath('business.id', (string) $businessA->getKey())
            ->assertJsonPath('membership.role', Role::BusinessOwner->value);

        $this->withToken($login->json('accessToken'))
            ->withHeader('X-Business-Id', (string) $businessB->getKey())
            ->getJson('/api/v1/tenant/context')
            ->assertForbidden()
            ->assertJsonPath('code', 'TENANT_MISMATCH');
    }

    public function test_switch_business_requires_membership_and_revokes_previous_access_context(): void
    {
        $user = User::factory()->create();
        $businessA = Business::create(['name' => 'Store A', 'slug' => 'store-a']);
        $businessB = Business::create(['name' => 'Store B', 'slug' => 'store-b']);
        $businessC = Business::create(['name' => 'Store C', 'slug' => 'store-c']);
        foreach ([[$businessA, Role::BusinessOwner], [$businessB, Role::Cashier]] as [$business, $role]) {
            Membership::create([
                'business_id' => $business->getKey(),
                'user_id' => $user->getKey(),
                'role' => $role,
            ]);
        }

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'businessId' => $businessA->getKey(),
        ]);
        $oldAccessToken = $login->json('accessToken');

        $this->withToken($oldAccessToken)
            ->postJson('/api/v1/auth/switch-business', ['businessId' => $businessC->getKey()])
            ->assertForbidden();

        $switch = $this->withToken($oldAccessToken)
            ->postJson('/api/v1/auth/switch-business', ['businessId' => $businessB->getKey()])
            ->assertOk()
            ->assertJsonPath('user.role', Role::Cashier->value);

        $this->withToken($oldAccessToken)->getJson('/api/v1/tenant/context')->assertUnauthorized();
        $this->withToken($switch->json('accessToken'))
            ->getJson('/api/v1/tenant/context')
            ->assertJsonPath('business.id', (string) $businessB->getKey());
    }

    public function test_inactive_membership_invalidates_an_existing_tenant_token(): void
    {
        $user = User::factory()->create();
        $business = Business::create(['name' => 'Store A', 'slug' => 'store-a']);
        $membership = Membership::create([
            'business_id' => $business->getKey(),
            'user_id' => $user->getKey(),
            'role' => Role::Staff,
        ]);
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $membership->update(['is_active' => false]);

        $this->withToken($login->json('accessToken'))
            ->getJson('/api/v1/tenant/context')
            ->assertUnauthorized();
    }

    public function test_platform_context_requires_super_admin_role(): void
    {
        $business = Business::create(['name' => 'Store A', 'slug' => 'store-a']);
        $owner = User::factory()->create();
        Membership::create([
            'business_id' => $business->getKey(),
            'user_id' => $owner->getKey(),
            'role' => Role::BusinessOwner,
        ]);
        $ownerLogin = $this->postJson('/api/v1/auth/login', [
            'email' => $owner->email,
            'password' => 'password',
        ]);
        $this->withToken($ownerLogin->json('accessToken'))
            ->getJson('/api/v1/platform/context')
            ->assertForbidden();

        $superAdmin = User::factory()->create(['platform_role' => Role::SuperAdmin]);
        $superLogin = $this->postJson('/api/v1/auth/login', [
            'email' => $superAdmin->email,
            'password' => 'password',
        ])->assertOk();
        $this->withToken($superLogin->json('accessToken'))
            ->getJson('/api/v1/platform/context')
            ->assertOk()
            ->assertJsonPath('role', Role::SuperAdmin->value);
    }

    public function test_business_policy_enforces_membership_and_owner_permissions(): void
    {
        $businessA = Business::create(['name' => 'Store A', 'slug' => 'store-a']);
        $businessB = Business::create(['name' => 'Store B', 'slug' => 'store-b']);
        $owner = User::factory()->create();
        $cashier = User::factory()->create();
        $outsider = User::factory()->create();
        Membership::create([
            'business_id' => $businessA->getKey(),
            'user_id' => $owner->getKey(),
            'role' => Role::BusinessOwner,
        ]);
        Membership::create([
            'business_id' => $businessA->getKey(),
            'user_id' => $cashier->getKey(),
            'role' => Role::Cashier,
        ]);

        $this->assertTrue(Gate::forUser($owner)->allows('update', $businessA));
        $this->assertFalse(Gate::forUser($cashier)->allows('update', $businessA));
        $this->assertTrue(Gate::forUser($cashier)->allows('view', $businessA));
        $this->assertFalse(Gate::forUser($outsider)->allows('view', $businessA));
        $this->assertFalse(Gate::forUser($owner)->allows('view', $businessB));
        $this->assertFalse(Gate::forUser($owner)->allows('delete', $businessA));
    }
}
