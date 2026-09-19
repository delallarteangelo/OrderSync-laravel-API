<?php

namespace Tests\Feature\Api;

use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\Membership;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_owner_can_create_and_list_a_cashier_for_the_current_business(): void
    {
        [$owner, $business, $token] = $this->createOwner('kevins-eleven');

        $created = $this->withToken($token)->postJson('/api/v1/users', [
            'fullName' => 'Mary Aquino',
            'email' => 'maryaquino@gmail.com',
            'role' => Role::Cashier->value,
            'isActive' => true,
            'password' => 'TempPass1234',
        ]);

        $created->assertCreated()
            ->assertJsonPath('fullName', 'Mary Aquino')
            ->assertJsonPath('role', Role::Cashier->value)
            ->assertJsonPath('business.id', (string) $business->getKey());

        $cashier = User::query()->where('email', 'maryaquino@gmail.com')->firstOrFail();
        $this->assertDatabaseHas('memberships', [
            'business_id' => $business->getKey(),
            'user_id' => $cashier->getKey(),
            'role' => Role::Cashier->value,
            'is_active' => true,
        ]);
        $this->withToken($token)->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonCount(2, 'items')
            ->assertJsonFragment(['email' => $owner->email])
            ->assertJsonFragment(['email' => 'maryaquino@gmail.com']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'maryaquino@gmail.com',
            'password' => 'TempPass1234',
        ])->assertOk()->assertJsonPath('user.role', Role::Cashier->value);
        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->getKey(),
            'actor_user_id' => $owner->getKey(),
            'action' => 'business_user.created',
        ]);
    }

    public function test_user_management_is_owner_only_and_tenant_scoped(): void
    {
        [, $businessA, $ownerToken] = $this->createOwner('store-a');
        [, $businessB, $otherOwnerToken] = $this->createOwner('store-b');
        $otherUser = User::factory()->create();
        Membership::create([
            'business_id' => $businessB->getKey(),
            'user_id' => $otherUser->getKey(),
            'role' => Role::Cashier,
        ]);

        $this->withToken($ownerToken)
            ->getJson("/api/v1/users/{$otherUser->getKey()}")
            ->assertNotFound();

        $cashier = User::factory()->create();
        Membership::create([
            'business_id' => $businessA->getKey(),
            'user_id' => $cashier->getKey(),
            'role' => Role::Cashier,
        ]);
        $cashierLogin = $this->postJson('/api/v1/auth/login', [
            'email' => $cashier->email,
            'password' => 'password',
        ])->assertOk();
        $this->withToken($cashierLogin->json('accessToken'))
            ->getJson('/api/v1/users')
            ->assertForbidden()
            ->assertJsonPath('code', 'FORBIDDEN');

        $this->withToken($otherOwnerToken)
            ->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonMissing(['email' => $cashier->email]);
    }

    public function test_deactivation_is_membership_scoped_and_revokes_that_business_session(): void
    {
        [$owner, $businessA, $ownerToken] = $this->createOwner('store-a');
        $businessB = $this->createBusiness('store-b');
        $cashier = User::factory()->create();
        $membershipA = Membership::create([
            'business_id' => $businessA->getKey(),
            'user_id' => $cashier->getKey(),
            'role' => Role::Cashier,
        ]);
        $membershipB = Membership::create([
            'business_id' => $businessB->getKey(),
            'user_id' => $cashier->getKey(),
            'role' => Role::Staff,
        ]);
        $cashierLogin = $this->postJson('/api/v1/auth/login', [
            'email' => $cashier->email,
            'password' => 'password',
            'businessId' => $businessA->getKey(),
        ])->assertOk();

        $this->withToken($ownerToken)
            ->postJson("/api/v1/users/{$cashier->getKey()}/deactivate")
            ->assertOk()
            ->assertJsonPath('isActive', false);

        $this->assertFalse($membershipA->fresh()->is_active);
        $this->assertTrue($membershipB->fresh()->is_active);
        $this->assertTrue($cashier->fresh()->is_active);
        $this->withToken($cashierLogin->json('accessToken'))
            ->getJson('/api/v1/tenant/context')
            ->assertUnauthorized();
        $this->withToken($ownerToken)
            ->postJson("/api/v1/users/{$owner->getKey()}/deactivate")
            ->assertForbidden()
            ->assertJsonPath('code', 'SELF_DEACTIVATE');
    }

    public function test_subscription_active_user_limit_is_enforced(): void
    {
        [, , $token] = $this->createOwner('basic-store', 'BASIC');

        $this->withToken($token)->postJson('/api/v1/users', [
            'fullName' => 'First Cashier',
            'email' => 'first.cashier@example.com',
            'role' => Role::Cashier->value,
            'password' => 'TempPass1234',
        ])->assertCreated();

        $this->withToken($token)->postJson('/api/v1/users', [
            'fullName' => 'Second Cashier',
            'email' => 'second.cashier@example.com',
            'role' => Role::Cashier->value,
            'password' => 'TempPass1234',
        ])->assertConflict()->assertJsonPath('code', 'USER_LIMIT_REACHED');
        $this->assertDatabaseMissing('users', ['email' => 'second.cashier@example.com']);
    }

    /** @return array{User, Business, string} */
    private function createOwner(string $slug, string $planCode = 'STANDARD'): array
    {
        $business = $this->createBusiness($slug, $planCode);
        $owner = User::factory()->create();
        Membership::create([
            'business_id' => $business->getKey(),
            'user_id' => $owner->getKey(),
            'role' => Role::BusinessOwner,
        ]);
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $owner->email,
            'password' => 'password',
        ])->assertOk();

        return [$owner, $business, $login->json('accessToken')];
    }

    private function createBusiness(string $slug, string $planCode = 'STANDARD'): Business
    {
        $business = Business::create(['name' => str($slug)->headline()->toString(), 'slug' => $slug]);
        $plan = SubscriptionPlan::query()->where('code', $planCode)->firstOrFail();
        $now = now();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(),
            'status' => SubscriptionStatus::Active,
            'starts_at' => $now,
            'current_period_start' => $now,
            'current_period_end' => $now->copy()->addMonth(),
        ]);

        return $business;
    }
}
