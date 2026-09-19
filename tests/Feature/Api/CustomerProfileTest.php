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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CustomerProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_updates_profile_and_uploads_a_persistent_avatar(): void
    {
        Storage::fake('public');
        [$user, $business, $token] = $this->customer('kevins-eleven');

        $this->withToken($token)->putJson('/api/v1/auth/profile', [
            'fullName' => 'Maria Customer',
            'email' => 'maria.customer@example.com',
            'phone' => '09171234567',
        ])->assertOk()
            ->assertJsonPath('user.fullName', 'Maria Customer')
            ->assertJsonPath('user.email', 'maria.customer@example.com')
            ->assertJsonPath('user.phone', '09171234567')
            ->assertJsonPath('user.business.id', (string) $business->getKey());

        $avatar = $this->withToken($token)->post('/api/v1/auth/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.png', 200, 200),
        ], ['Accept' => 'application/json'])->assertOk()->json('user.avatarUrl');
        $path = $user->customerProfile()->value('avatar_path');
        Storage::disk('public')->assertExists($path);
        $this->assertSame(Storage::disk('public')->url($path), $avatar);

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk()
            ->assertJsonPath('fullName', 'Maria Customer')
            ->assertJsonPath('phone', '09171234567')
            ->assertJsonPath('avatarUrl', $avatar);
        $this->assertDatabaseHas('audit_logs', ['actor_user_id' => $user->getKey(), 'action' => 'customer.profile_updated']);
        $this->assertDatabaseHas('audit_logs', ['actor_user_id' => $user->getKey(), 'action' => 'user.avatar_updated']);
    }

    public function test_business_workspace_member_uploads_a_persistent_avatar(): void
    {
        Storage::fake('public');
        [$user, $business, $token] = $this->member('workspace-avatar', Role::Cashier);

        $avatar = $this->withToken($token)->post('/api/v1/auth/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('cashier.png', 256, 256),
        ], ['Accept' => 'application/json'])->assertOk()
            ->assertJsonPath('user.id', (string) $user->getKey())
            ->assertJsonPath('user.role', Role::Cashier->value)
            ->assertJsonPath('user.business.id', (string) $business->getKey())
            ->json('user.avatarUrl');

        $path = $user->customerProfile()->value('avatar_path');
        Storage::disk('public')->assertExists($path);
        $this->assertStringStartsWith('user-avatars/', $path);
        $this->assertSame(Storage::disk('public')->url($path), $avatar);
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk()
            ->assertJsonPath('avatarUrl', $avatar);
        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $user->getKey(),
            'business_id' => $business->getKey(),
            'action' => 'user.avatar_updated',
        ]);
    }

    public function test_customer_can_manage_addresses_with_one_default(): void
    {
        [$user, , $token] = $this->customer('address-store');
        $home = $this->withToken($token)->postJson('/api/v1/auth/addresses', [
            'label' => 'Home', 'line1' => '1 Main Street', 'line2' => 'Barangay One', 'city' => 'Lingayen, Pangasinan',
        ])->assertCreated()->assertJsonPath('isDefault', true)->json();
        $work = $this->withToken($token)->postJson('/api/v1/auth/addresses', [
            'label' => 'Work', 'line1' => '2 Office Road', 'line2' => '', 'city' => 'Dagupan City', 'isDefault' => true,
        ])->assertCreated()->assertJsonPath('isDefault', true)->json();

        $this->withToken($token)->getJson('/api/v1/auth/addresses')->assertOk()
            ->assertJsonCount(2, 'items')->assertJsonPath('items.0.id', $work['id']);
        $this->assertDatabaseHas('customer_addresses', ['id' => $home['id'], 'user_id' => $user->getKey(), 'is_default' => false]);
        $this->assertDatabaseHas('customer_addresses', ['id' => $work['id'], 'user_id' => $user->getKey(), 'is_default' => true]);

        $this->withToken($token)->putJson("/api/v1/auth/addresses/{$home['id']}", [
            'label' => 'Parents', 'line1' => '3 Updated Street', 'line2' => '', 'city' => 'Lingayen', 'isDefault' => true,
        ])->assertOk()->assertJsonPath('label', 'Parents')->assertJsonPath('isDefault', true);
        $this->withToken($token)->deleteJson("/api/v1/auth/addresses/{$home['id']}")->assertNoContent();
        $this->assertDatabaseHas('customer_addresses', ['id' => $work['id'], 'is_default' => true]);
        $this->assertDatabaseHas('audit_logs', ['actor_user_id' => $user->getKey(), 'action' => 'customer.address_deleted']);
    }

    public function test_profile_and_addresses_are_customer_only_and_self_scoped(): void
    {
        [, , $tokenA] = $this->customer('store-a');
        [, , $tokenB] = $this->customer('store-b');
        $foreign = $this->withToken($tokenA)->postJson('/api/v1/auth/addresses', [
            'label' => 'Home', 'line1' => 'Private Street', 'city' => 'Private City',
        ])->assertCreated()->json('id');

        $this->withToken($tokenB)->putJson("/api/v1/auth/addresses/$foreign", [
            'label' => 'Stolen', 'line1' => 'Other', 'city' => 'Other',
        ])->assertNotFound();
        $this->withToken($tokenB)->deleteJson("/api/v1/auth/addresses/$foreign")->assertNotFound();

        [$owner, $business, $ownerToken] = $this->member('owner-store', Role::BusinessOwner);
        $this->withToken($ownerToken)->getJson('/api/v1/auth/addresses')->assertForbidden();
        $this->withToken($ownerToken)->putJson('/api/v1/auth/profile', [
            'fullName' => $owner->name, 'email' => $owner->email, 'phone' => '',
        ])->assertForbidden();
        $this->assertNotNull($business);
    }

    /** @return array{User, Business, string} */
    private function customer(string $slug): array
    {
        return $this->member($slug, Role::Customer);
    }

    /** @return array{User, Business, string} */
    private function member(string $slug, Role $role): array
    {
        $business = Business::create(['name' => str($slug)->headline()->toString(), 'slug' => $slug, 'status' => BusinessStatus::Active, 'approved_at' => now()]);
        $plan = SubscriptionPlan::query()->where('code', 'STANDARD')->firstOrFail();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(), 'status' => SubscriptionStatus::Active,
            'starts_at' => now(), 'current_period_start' => now(), 'current_period_end' => now()->addMonth(),
        ]);
        $user = User::factory()->create();
        Membership::create(['business_id' => $business->getKey(), 'user_id' => $user->getKey(), 'role' => $role]);
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password', 'businessId' => $business->getKey(),
        ], ['X-Client-Platform' => $role === Role::Customer ? 'mobile' : 'web'])->assertOk()->json('accessToken');

        return [$user, $business, $token];
    }
}
