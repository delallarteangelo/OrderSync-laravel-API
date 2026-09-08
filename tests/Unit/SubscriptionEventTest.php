<?php

namespace Tests\Unit;

use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

class SubscriptionEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_subscription_history_cannot_be_updated_or_deleted(): void
    {
        $business = Business::query()->create(['name' => 'Store', 'slug' => 'store']);
        $subscription = Subscription::query()->create([
            'business_id' => $business->getKey(),
            'subscription_plan_id' => SubscriptionPlan::query()->where('code', 'BASIC')->value('id'),
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
        ]);
        $event = SubscriptionEvent::query()->create([
            'business_id' => $business->getKey(),
            'subscription_id' => $subscription->getKey(),
            'actor_user_id' => User::factory()->create(['platform_role' => Role::SuperAdmin])->getKey(),
            'event_type' => 'subscription.started',
            'to_status' => SubscriptionStatus::Active->value,
        ]);

        try {
            $event->update(['event_type' => 'tampered']);
            $this->fail('Updating subscription history should throw.');
        } catch (LogicException) {
            $this->assertSame('subscription.started', $event->fresh()->event_type);
        }

        $this->expectException(LogicException::class);
        $event->delete();
    }
}
