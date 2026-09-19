<?php

namespace Tests\Feature\Api;

use App\Enums\BusinessStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\Membership;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_for_an_available_store_and_use_mobile_session(): void
    {
        $business = $this->business('Local Store', 'local-store', 'STANDARD');

        $response = $this->withHeaders([
            'X-Client' => 'ordersync-android',
            'X-Client-Platform' => 'mobile',
        ])->postJson('/api/v1/auth/register-customer', [
            'fullName' => 'New Customer',
            'email' => 'NEW.Customer@example.com',
            'password' => 'SecurePass1234',
            'businessId' => $business->getKey(),
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'new.customer@example.com')
            ->assertJsonPath('user.role', Role::Customer->value)
            ->assertJsonPath('user.business.slug', 'local-store')
            ->assertJsonStructure(['accessToken', 'refreshToken']);
        $user = User::query()->where('email', 'new.customer@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('SecurePass1234', $user->password));
        $this->assertDatabaseHas('memberships', [
            'business_id' => $business->getKey(),
            'user_id' => $user->getKey(),
            'role' => Role::Customer->value,
        ]);
        $this->withToken($response->json('accessToken'))
            ->getJson('/api/v1/customer/orders')
            ->assertOk();
        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.customer_registered', 'business_id' => $business->getKey()]);
    }

    public function test_registration_rejects_duplicate_email_and_unavailable_store_without_creating_users(): void
    {
        $available = $this->business('Available Store', 'available-store', 'STANDARD');
        $unavailable = $this->business('Unavailable Store', 'unavailable-store', 'BASIC');
        User::factory()->create(['email' => 'existing@example.com']);
        $payload = [
            'fullName' => 'New Customer',
            'email' => 'EXISTING@example.com',
            'password' => 'SecurePass1234',
            'businessId' => $available->getKey(),
        ];

        $this->postJson('/api/v1/auth/register-customer', $payload)
            ->assertUnprocessable()
            ->assertJsonPath('code', 'EMAIL_ALREADY_REGISTERED');
        $this->postJson('/api/v1/auth/register-customer', array_merge($payload, [
            'email' => 'new@example.com',
            'businessId' => $unavailable->getKey(),
        ]))->assertUnprocessable()->assertJsonPath('code', 'STORE_UNAVAILABLE');
        $this->postJson('/api/v1/auth/register-customer', array_merge($payload, [
            'email' => 'new@example.com',
            'businessId' => 999999,
        ]))->assertUnprocessable()->assertJsonPath('code', 'STORE_UNAVAILABLE');
        $this->assertDatabaseMissing('users', ['email' => 'new@example.com']);
    }

    public function test_registration_validates_password_and_active_store(): void
    {
        $business = $this->business('Paused Store', 'paused-store', 'STANDARD');
        $business->update(['status' => BusinessStatus::Suspended]);
        $payload = [
            'fullName' => 'New Customer',
            'email' => 'new@example.com',
            'password' => 'short',
            'businessId' => $business->getKey(),
        ];

        $this->postJson('/api/v1/auth/register-customer', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');
        $this->postJson('/api/v1/auth/register-customer', array_merge($payload, [
            'password' => 'SecurePass1234',
        ]))->assertUnprocessable()->assertJsonPath('code', 'STORE_UNAVAILABLE');
    }

    public function test_mobile_login_selects_only_customer_ordering_enabled_memberships(): void
    {
        $basic = $this->business('Basic Store', 'basic-store', 'BASIC');
        $ordering = $this->business('Ordering Store', 'ordering-store', 'STANDARD');
        $user = User::factory()->create(['password' => 'SecurePass1234']);
        foreach ([$basic, $ordering] as $business) {
            Membership::query()->create([
                'business_id' => $business->getKey(),
                'user_id' => $user->getKey(),
                'role' => Role::Customer,
            ]);
        }

        $this->withHeader('X-Client-Platform', 'mobile')
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'SecurePass1234',
            ])->assertOk()->assertJsonPath('user.business.slug', 'ordering-store');

        $ordering->update(['status' => BusinessStatus::Suspended]);
        $this->withHeader('X-Client-Platform', 'mobile')
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'SecurePass1234',
            ])->assertForbidden()->assertJsonPath('code', 'NO_AVAILABLE_STOREFRONT');
    }

    private function business(string $name, string $slug, string $planCode): Business
    {
        $business = Business::query()->create([
            'name' => $name,
            'slug' => $slug,
            'status' => BusinessStatus::Active,
            'approved_at' => now(),
        ]);
        $plan = SubscriptionPlan::query()->where('code', $planCode)->firstOrFail();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(),
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
        ]);

        return $business;
    }
}
