<?php

namespace App\Services;

use App\Enums\BillingStatus;
use App\Enums\BusinessStatus;
use App\Enums\SubscriptionStatus;
use App\Models\BillingRecord;
use App\Models\Business;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionRequest;
use App\Models\User;
use DomainException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionAdministrationService
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly AuthTokenService $tokens,
        private readonly SubscriptionRequestService $applications,
    ) {}

    public function approve(Business $business, User $actor, Request $request): Business
    {
        $application = SubscriptionRequest::query()->where('business_id', $business->getKey())
            ->where('kind', 'INITIAL')->latest('id')->first();
        if ($application) {
            $this->applications->review($application, $actor, $request, true, null);

            return $business->fresh(['subscription.plan.entitlements', 'memberships.user']);
        }

        return DB::transaction(function () use ($business, $actor, $request): Business {
            $business = Business::query()->lockForUpdate()->findOrFail($business->getKey());
            if ($business->status !== BusinessStatus::Pending) {
                throw new DomainException('Only pending businesses can be approved.');
            }

            $plan = SubscriptionPlan::query()->where('code', 'BASIC')->where('is_active', true)->firstOrFail();
            $now = now();
            $business->update([
                'status' => BusinessStatus::Active,
                'approved_at' => $now,
                'suspended_at' => null,
                'suspension_reason' => null,
            ]);
            $subscription = Subscription::query()->create([
                'business_id' => $business->getKey(),
                'subscription_plan_id' => $plan->getKey(),
                'status' => SubscriptionStatus::Active,
                'starts_at' => $now,
                'current_period_start' => $now,
                'current_period_end' => $now->copy()->addMonthNoOverflow(),
                'period_price_minor' => $plan->price_minor,
            ]);
            $this->event($subscription, $actor, 'subscription.started', null, SubscriptionStatus::Active->value, null, $plan->code);
            $this->audit->record('business.approved', $request, $actor, $business, Business::class, $business->getKey(), ['plan_code' => $plan->code]);

            return $business->fresh(['subscription.plan.entitlements', 'memberships.user']);
        });
    }

    public function suspend(Business $business, User $actor, Request $request, string $reason): Business
    {
        return DB::transaction(function () use ($business, $actor, $request, $reason): Business {
            $business = Business::query()->lockForUpdate()->findOrFail($business->getKey());
            if ($business->status !== BusinessStatus::Active) {
                throw new DomainException('Only active businesses can be suspended.');
            }
            $business->update([
                'status' => BusinessStatus::Suspended,
                'suspended_at' => now(),
                'suspension_reason' => $reason,
            ]);
            $this->tokens->revokeBusinessSessions($business->getKey());
            $this->audit->record('business.suspended', $request, $actor, $business, Business::class, $business->getKey(), ['reason' => $reason]);

            return $business->fresh(['subscription.plan.entitlements', 'memberships.user']);
        });
    }

    public function reactivate(Business $business, User $actor, Request $request): Business
    {
        return DB::transaction(function () use ($business, $actor, $request): Business {
            $business = Business::query()->lockForUpdate()->findOrFail($business->getKey());
            if ($business->status !== BusinessStatus::Suspended) {
                throw new DomainException('Only suspended businesses can be reactivated.');
            }
            $business->update([
                'status' => BusinessStatus::Active,
                'suspended_at' => null,
                'suspension_reason' => null,
            ]);
            $this->audit->record('business.reactivated', $request, $actor, $business, Business::class, $business->getKey());

            return $business->fresh(['subscription.plan.entitlements', 'memberships.user']);
        });
    }

    public function assign(Business $business, SubscriptionPlan $plan, int $months, User $actor, Request $request): Subscription
    {
        return DB::transaction(function () use ($business, $plan, $months, $actor, $request): Subscription {
            $business = Business::query()->lockForUpdate()->findOrFail($business->getKey());
            if ($business->status !== BusinessStatus::Active) {
                throw new DomainException('Subscriptions can be assigned only to active businesses.');
            }
            if (! $plan->is_active) {
                throw new DomainException('The selected subscription plan is inactive.');
            }
            if (SubscriptionRequest::query()->where('business_id', $business->getKey())
                ->whereIn('status', ['PENDING_REVIEW', 'AWAITING_PAYMENT', 'PAYMENT_SUBMITTED'])->exists()) {
                throw new DomainException('Resolve the subscription request before manually reassigning a plan.');
            }

            $subscription = Subscription::query()->where('business_id', $business->getKey())->lockForUpdate()->first();
            $fromStatus = $subscription?->status->value;
            $fromPlan = $subscription?->plan?->code;
            $now = now();
            $values = [
                'subscription_plan_id' => $plan->getKey(),
                'status' => SubscriptionStatus::Active,
                'starts_at' => $subscription?->starts_at ?? $now,
                'current_period_start' => $now,
                'current_period_end' => $now->copy()->addMonthsNoOverflow($months),
                'grace_ends_at' => null,
                'cancelled_at' => null,
                'period_price_minor' => $plan->price_minor,
            ];
            if ($subscription) {
                $subscription->update($values);
            } else {
                $subscription = Subscription::query()->create(['business_id' => $business->getKey(), ...$values]);
            }
            $this->event($subscription, $actor, 'subscription.assigned', $fromStatus, SubscriptionStatus::Active->value, $fromPlan, $plan->code, ['months' => $months]);
            $this->audit->record('subscription.assigned', $request, $actor, $business, Subscription::class, $subscription->getKey(), ['plan_code' => $plan->code, 'months' => $months]);

            return $subscription->fresh('plan.entitlements');
        });
    }

    public function renew(Subscription $subscription, int $months, User $actor, Request $request): Subscription
    {
        return DB::transaction(function () use ($subscription, $months, $actor, $request): Subscription {
            $subscription = Subscription::query()->with(['business', 'plan'])->lockForUpdate()->findOrFail($subscription->getKey());
            $fromStatus = $subscription->effectiveStatus()->value;
            $periodStart = $subscription->current_period_end->isFuture() ? $subscription->current_period_end : now();
            $subscription->update([
                'status' => SubscriptionStatus::Active,
                'current_period_start' => $periodStart,
                'current_period_end' => $periodStart->copy()->addMonthsNoOverflow($months),
                'grace_ends_at' => null,
                'cancelled_at' => null,
                'period_price_minor' => $subscription->plan->price_minor,
            ]);
            $this->event($subscription, $actor, 'subscription.renewed', $fromStatus, SubscriptionStatus::Active->value, $subscription->plan->code, $subscription->plan->code, ['months' => $months]);
            $this->audit->record('subscription.renewed', $request, $actor, $subscription->business, Subscription::class, $subscription->getKey(), ['months' => $months]);

            return $subscription->fresh('plan.entitlements');
        });
    }

    public function grantGrace(Subscription $subscription, int $days, User $actor, Request $request): Subscription
    {
        return DB::transaction(function () use ($subscription, $days, $actor, $request): Subscription {
            $subscription = Subscription::query()->with(['business', 'plan'])->lockForUpdate()->findOrFail($subscription->getKey());
            if ($subscription->status === SubscriptionStatus::Cancelled) {
                throw new DomainException('A cancelled subscription cannot enter a grace period.');
            }
            $fromStatus = $subscription->effectiveStatus()->value;
            $base = $subscription->current_period_end->isFuture() ? $subscription->current_period_end : now();
            $subscription->update([
                'status' => SubscriptionStatus::Grace,
                'grace_ends_at' => $base->copy()->addDays($days),
            ]);
            $this->event($subscription, $actor, 'subscription.grace_granted', $fromStatus, SubscriptionStatus::Grace->value, $subscription->plan->code, $subscription->plan->code, ['days' => $days]);
            $this->audit->record('subscription.grace_granted', $request, $actor, $subscription->business, Subscription::class, $subscription->getKey(), ['days' => $days]);

            return $subscription->fresh('plan.entitlements');
        });
    }

    public function cancel(Subscription $subscription, User $actor, Request $request): Subscription
    {
        return DB::transaction(function () use ($subscription, $actor, $request): Subscription {
            $subscription = Subscription::query()->with(['business', 'plan'])->lockForUpdate()->findOrFail($subscription->getKey());
            if ($subscription->status === SubscriptionStatus::Cancelled) {
                throw new DomainException('The subscription is already cancelled.');
            }
            $fromStatus = $subscription->effectiveStatus()->value;
            $subscription->update(['status' => SubscriptionStatus::Cancelled, 'cancelled_at' => now()]);
            $this->event($subscription, $actor, 'subscription.cancelled', $fromStatus, SubscriptionStatus::Cancelled->value, $subscription->plan->code, $subscription->plan->code);
            $this->audit->record('subscription.cancelled', $request, $actor, $subscription->business, Subscription::class, $subscription->getKey());

            return $subscription->fresh('plan.entitlements');
        });
    }

    /** @param array<string, mixed> $values */
    public function createBillingRecord(Subscription $subscription, array $values, User $actor, Request $request): BillingRecord
    {
        return DB::transaction(function () use ($subscription, $values, $actor, $request): BillingRecord {
            $subscription = Subscription::query()->with('business')->lockForUpdate()->findOrFail($subscription->getKey());
            $record = BillingRecord::query()->create([
                'business_id' => $subscription->business_id,
                'subscription_id' => $subscription->getKey(),
                'status' => BillingStatus::Pending,
                ...$values,
            ]);
            $this->audit->record('billing.created', $request, $actor, $subscription->business, BillingRecord::class, $record->getKey(), ['amount_minor' => $record->amount_minor, 'currency' => $record->currency]);

            return $record->load('business');
        });
    }

    public function markBillingPaid(BillingRecord $record, ?string $reference, User $actor, Request $request): BillingRecord
    {
        return DB::transaction(function () use ($record, $reference, $actor, $request): BillingRecord {
            $record = BillingRecord::query()->with('business')->lockForUpdate()->findOrFail($record->getKey());
            if ($record->subscription_request_id !== null) {
                throw new DomainException('Application bills require verified wallet proof; manual mark-paid cannot activate a plan.');
            }
            if ($record->status !== BillingStatus::Pending && $record->status !== BillingStatus::Overdue) {
                throw new DomainException('Only pending or overdue billing records can be marked paid.');
            }
            $record->update(['status' => BillingStatus::Paid, 'paid_at' => now(), 'reference' => $reference]);
            $this->audit->record('billing.marked_paid', $request, $actor, $record->business, BillingRecord::class, $record->getKey(), ['amount_minor' => $record->amount_minor, 'currency' => $record->currency]);

            return $record;
        });
    }

    /** @param array<string, int|string> $metadata */
    private function event(
        Subscription $subscription,
        User $actor,
        string $eventType,
        ?string $fromStatus,
        ?string $toStatus,
        ?string $fromPlan,
        ?string $toPlan,
        array $metadata = [],
    ): void {
        SubscriptionEvent::query()->create([
            'business_id' => $subscription->business_id,
            'subscription_id' => $subscription->getKey(),
            'actor_user_id' => $actor->getKey(),
            'event_type' => $eventType,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'from_plan_code' => $fromPlan,
            'to_plan_code' => $toPlan,
            'metadata' => $metadata === [] ? null : $metadata,
        ]);
    }
}
