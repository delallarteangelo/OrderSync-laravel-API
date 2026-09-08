<?php

namespace Tests\Feature\Api;

use App\Enums\BusinessStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\BillingRecord;
use App\Models\Business;
use App\Models\Membership;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformAdministrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_stays_pending_until_a_super_admin_approves_it(): void
    {
        $registration = $this->postJson('/api/v1/business-registrations', [
            'businessName' => 'Fresh Corner Store',
            'ownerName' => 'Maria Owner',
            'ownerEmail' => 'maria@example.test',
            'password' => 'Registration123',
            'timezone' => 'Asia/Manila',
        ])->assertCreated()
            ->assertJsonPath('business.status', BusinessStatus::Pending->value)
            ->assertJsonPath('business.owner.email', 'maria@example.test');

        $business = Business::query()->findOrFail($registration->json('business.id'));
        $owner = User::query()->where('email', 'maria@example.test')->firstOrFail();
        $this->assertDatabaseHas('memberships', [
            'business_id' => $business->getKey(),
            'user_id' => $owner->getKey(),
            'role' => Role::BusinessOwner->value,
        ]);
        $this->postJson('/api/v1/auth/login', [
            'email' => $owner->email,
            'password' => 'Registration123',
        ])->assertForbidden();

        $approval = $this->withToken($this->superAdminToken())
            ->postJson("/api/v1/platform/businesses/{$business->getKey()}/approve")
            ->assertOk()
            ->assertJsonPath('business.status', BusinessStatus::Active->value)
            ->assertJsonPath('business.subscription.plan.code', 'BASIC');

        $this->assertNotNull($approval->json('business.approvedAt'));
        $this->postJson('/api/v1/auth/login', [
            'email' => $owner->email,
            'password' => 'Registration123',
        ])->assertOk();
        $this->assertDatabaseHas('audit_logs', ['action' => 'business.registration_submitted']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'business.approved']);
        $this->assertDatabaseHas('subscription_events', ['event_type' => 'subscription.started']);

        $this->postJson('/api/v1/business-registrations', [
            'businessName' => 'Duplicate Owner Store',
            'ownerName' => 'Maria Again',
            'ownerEmail' => 'MARIA@EXAMPLE.TEST',
            'password' => 'Registration123',
        ])->assertUnprocessable()->assertJsonValidationErrors('ownerEmail');
    }

    public function test_only_super_admin_can_access_the_platform_control_plane(): void
    {
        [$owner, $business] = $this->createMemberBusiness();
        $ownerToken = $this->login($owner, $business);

        $this->withToken($ownerToken)->getJson('/api/v1/platform/businesses')->assertForbidden();
        $this->withHeader('Authorization', '')->getJson('/api/v1/platform/businesses')->assertUnauthorized();
        $this->withToken($this->superAdminToken())
            ->getJson('/api/v1/platform/businesses')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_suspension_revokes_tenant_sessions_and_reactivation_preserves_data(): void
    {
        [$owner, $business] = $this->createMemberBusiness();
        $ownerToken = $this->login($owner, $business);
        $adminToken = $this->superAdminToken();

        $this->withToken($adminToken)
            ->postJson("/api/v1/platform/businesses/{$business->getKey()}/suspend", ['reason' => 'Manual compliance review'])
            ->assertOk()
            ->assertJsonPath('business.status', BusinessStatus::Suspended->value);

        $this->withToken($ownerToken)->getJson('/api/v1/tenant/context')->assertUnauthorized();
        $this->assertDatabaseHas('memberships', ['business_id' => $business->getKey(), 'user_id' => $owner->getKey()]);
        $this->assertDatabaseHas('subscriptions', ['business_id' => $business->getKey()]);
        $this->assertDatabaseMissing('access_tokens', ['business_id' => $business->getKey(), 'revoked_at' => null]);

        $this->withToken($adminToken)
            ->postJson("/api/v1/platform/businesses/{$business->getKey()}/reactivate")
            ->assertOk()
            ->assertJsonPath('business.status', BusinessStatus::Active->value);
        $this->postJson('/api/v1/auth/login', ['email' => $owner->email, 'password' => 'password'])->assertOk();
    }

    public function test_plan_configuration_and_subscription_lifecycle_are_audited(): void
    {
        [, $business] = $this->createMemberBusiness();
        $adminToken = $this->superAdminToken();
        $standard = SubscriptionPlan::query()->where('code', 'STANDARD')->firstOrFail();

        $this->withToken($adminToken)
            ->patchJson("/api/v1/platform/plans/{$standard->getKey()}", [
                'priceMinor' => 149900,
                'graceDays' => 10,
                'entitlements' => ['max_users' => 12, 'ai_support_enabled' => true],
            ])->assertOk()
            ->assertJsonPath('plan.priceMinor', 149900)
            ->assertJsonPath('plan.entitlements.max_users', 12)
            ->assertJsonPath('plan.entitlements.ai_support_enabled', true);

        $assignment = $this->withToken($adminToken)
            ->putJson("/api/v1/platform/businesses/{$business->getKey()}/subscription", [
                'planCode' => 'STANDARD',
                'months' => 2,
            ])->assertOk()
            ->assertJsonPath('subscription.plan.code', 'STANDARD');
        $subscriptionId = $assignment->json('subscription.id');

        $this->withToken($adminToken)
            ->postJson("/api/v1/platform/subscriptions/$subscriptionId/renew", ['months' => 1])
            ->assertOk()
            ->assertJsonPath('subscription.effectiveStatus', SubscriptionStatus::Active->value);

        $subscription = Subscription::query()->findOrFail($subscriptionId);
        $subscription->update(['current_period_end' => now()->subDay(), 'current_period_start' => now()->subMonth()]);
        $this->withToken($adminToken)
            ->postJson("/api/v1/platform/subscriptions/$subscriptionId/grace", ['days' => 5])
            ->assertOk()
            ->assertJsonPath('subscription.effectiveStatus', SubscriptionStatus::Grace->value);
        $this->withToken($adminToken)
            ->postJson("/api/v1/platform/subscriptions/$subscriptionId/cancel")
            ->assertOk()
            ->assertJsonPath('subscription.effectiveStatus', SubscriptionStatus::Cancelled->value);

        $history = $this->withToken($adminToken)
            ->getJson("/api/v1/platform/subscriptions/$subscriptionId/history")
            ->assertOk();
        $this->assertCount(4, $history->json('events'));
        $this->assertDatabaseHas('audit_logs', ['action' => 'subscription_plan.updated']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'subscription.cancelled']);
    }

    public function test_internal_billing_records_and_dashboard_metrics_are_consistent(): void
    {
        [, $business] = $this->createMemberBusiness();
        $subscription = $business->subscription;
        $adminToken = $this->superAdminToken();
        $start = now()->startOfDay();

        $created = $this->withToken($adminToken)
            ->postJson("/api/v1/platform/subscriptions/{$subscription->getKey()}/billing-records", [
                'amountMinor' => 99900,
                'currency' => 'PHP',
                'periodStart' => $start->toIso8601String(),
                'periodEnd' => $start->copy()->addMonth()->toIso8601String(),
                'dueAt' => $start->copy()->addDays(7)->toIso8601String(),
                'reference' => 'INTERNAL-001',
            ])->assertCreated()
            ->assertJsonPath('billingRecord.status', 'PENDING');
        $billingId = $created->json('billingRecord.id');

        $this->withToken($adminToken)
            ->postJson("/api/v1/platform/billing-records/$billingId/mark-paid", ['reference' => 'MANUAL-RECEIPT-1'])
            ->assertOk()
            ->assertJsonPath('billingRecord.status', 'PAID');

        $this->withToken($adminToken)
            ->getJson('/api/v1/platform/dashboard')
            ->assertOk()
            ->assertJsonPath('businesses.active', 1)
            ->assertJsonPath('subscriptions.active', 1)
            ->assertJsonPath('billing.paidRecords', 1)
            ->assertJsonPath('billing.paidAmountMinor', 99900);
        $this->assertSame('MANUAL-RECEIPT-1', BillingRecord::query()->findOrFail($billingId)->reference);
    }

    public function test_owner_can_read_only_the_subscription_bound_to_their_token(): void
    {
        [$ownerA, $businessA] = $this->createMemberBusiness('Business A', 'business-a');
        [, $businessB] = $this->createMemberBusiness('Business B', 'business-b');

        $this->withToken($this->login($ownerA, $businessA))
            ->getJson('/api/v1/tenant/subscription')
            ->assertOk()
            ->assertJsonPath('business.id', (string) $businessA->getKey())
            ->assertJsonPath('subscription.businessId', (string) $businessA->getKey())
            ->assertJsonMissing(['businessId' => (string) $businessB->getKey()]);
    }

    public function test_platform_user_administration_prevents_lockout_and_revokes_disabled_user_sessions(): void
    {
        [$owner, $business] = $this->createMemberBusiness();
        $ownerToken = $this->login($owner, $business);
        $admin = User::factory()->create(['platform_role' => Role::SuperAdmin]);
        $adminToken = $this->login($admin);

        $this->withToken($adminToken)
            ->patchJson("/api/v1/platform/users/{$admin->getKey()}/status", ['isActive' => false])
            ->assertStatus(409)
            ->assertJsonPath('code', 'SELF_DEACTIVATION_FORBIDDEN');

        $this->withToken($adminToken)
            ->patchJson("/api/v1/platform/users/{$owner->getKey()}/status", ['isActive' => false])
            ->assertOk()
            ->assertJsonPath('user.isActive', false);
        $this->withToken($ownerToken)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->assertDatabaseMissing('access_tokens', ['user_id' => $owner->getKey(), 'revoked_at' => null]);
    }

    /** @return array{User, Business} */
    private function createMemberBusiness(string $name = 'Pilot Store', string $slug = 'pilot-store'): array
    {
        $owner = User::factory()->create();
        $business = Business::query()->create([
            'name' => $name,
            'slug' => $slug,
            'status' => BusinessStatus::Active,
            'approved_at' => now(),
        ]);
        Membership::query()->create([
            'business_id' => $business->getKey(),
            'user_id' => $owner->getKey(),
            'role' => Role::BusinessOwner,
        ]);
        $plan = SubscriptionPlan::query()->where('code', 'BASIC')->firstOrFail();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(),
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
        ]);

        return [$owner, $business->fresh('subscription')];
    }

    private function superAdminToken(): string
    {
        return $this->login(User::factory()->create(['platform_role' => Role::SuperAdmin]));
    }

    private function login(User $user, ?Business $business = null): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            ...($business ? ['businessId' => $business->getKey()] : []),
        ])->assertOk();

        return $response->json('accessToken');
    }
}
