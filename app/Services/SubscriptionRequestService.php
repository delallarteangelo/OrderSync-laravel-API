<?php

namespace App\Services;

use App\Enums\BillingStatus;
use App\Enums\BusinessStatus;
use App\Enums\SubscriptionStatus;
use App\Models\BillingRecord;
use App\Models\Business;
use App\Models\PlatformWallet;
use App\Models\RecordedPayment;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionRequest;
use App\Models\User;
use DomainException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubscriptionRequestService
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function initial(Business $business, User $owner, SubscriptionPlan $plan): array
    {
        $token = Str::random(64);
        $application = SubscriptionRequest::query()->create([
            'business_id' => $business->getKey(),
            'requested_by_user_id' => $owner->getKey(),
            'kind' => 'INITIAL',
            'status' => 'PENDING_REVIEW',
            'desired_plan_id' => $plan->getKey(),
            'application_token_hash' => hash('sha256', $token),
            'application_token_expires_at' => now()->addDays(30),
        ]);

        return [$application, $token];
    }

    public function rotateApplicationToken(SubscriptionRequest $application): string
    {
        $token = Str::random(64);
        $application->update([
            'application_token_hash' => hash('sha256', $token),
            'application_token_expires_at' => now()->addDays(30),
        ]);

        return $token;
    }

    public function authenticateApplication(SubscriptionRequest $application, ?string $token): void
    {
        abort_unless($application->kind === 'INITIAL'
            && $application->application_token_expires_at?->isFuture()
            && is_string($token) && strlen($token) === 64
            && hash_equals((string) $application->application_token_hash, hash('sha256', $token)), 404);
    }

    public function requestUpgrade(Business $business, User $owner, SubscriptionPlan $target, Request $request): SubscriptionRequest
    {
        return DB::transaction(function () use ($business, $owner, $target, $request): SubscriptionRequest {
            $business = Business::query()->lockForUpdate()->findOrFail($business->getKey());
            $subscription = Subscription::query()->with('plan')->where('business_id', $business->getKey())->lockForUpdate()->firstOrFail();
            if ($business->status !== BusinessStatus::Active || $subscription->effectiveStatus() !== SubscriptionStatus::Active) {
                throw new DomainException('An active paid period is required to request an upgrade.');
            }
            if (SubscriptionRequest::query()->where('business_id', $business->getKey())
                ->whereIn('status', ['PENDING_REVIEW', 'AWAITING_PAYMENT', 'PAYMENT_SUBMITTED'])->exists()) {
                throw new DomainException('Finish or resolve the current subscription request first.');
            }
            $quote = $this->upgradeQuote($subscription, $target);
            $application = SubscriptionRequest::query()->create([
                'business_id' => $business->getKey(),
                'requested_by_user_id' => $owner->getKey(),
                'kind' => 'UPGRADE',
                'status' => 'PENDING_REVIEW',
                'desired_plan_id' => $target->getKey(),
                'from_plan_id' => $subscription->subscription_plan_id,
                'plan_price_minor' => $quote['newPriceMinor'],
                'from_price_minor' => $quote['oldPriceMinor'],
                'amount_due_minor' => $quote['amountDueMinor'],
                'period_end_snapshot' => $subscription->current_period_end,
                'quote_expires_at' => $quote['expiresAt'],
            ]);
            $this->audit->record('subscription.upgrade_requested', $request, $owner, $business, SubscriptionRequest::class, $application->getKey(), [
                'from_plan' => $subscription->plan->code, 'to_plan' => $target->code, 'amount_minor' => $quote['amountDueMinor'],
            ]);

            return $application->fresh(['desiredPlan.entitlements', 'fromPlan.entitlements']);
        });
    }

    /** @return array{newPriceMinor:int,oldPriceMinor:int,amountDueMinor:int,expiresAt:\Carbon\CarbonInterface} */
    public function upgradeQuote(Subscription $subscription, SubscriptionPlan $target): array
    {
        $rank = ['BASIC' => 1, 'STANDARD' => 2, 'PREMIUM' => 3];
        if (! $target->is_active || ($rank[$target->code] ?? 0) <= ($rank[$subscription->plan->code] ?? 0)) {
            throw new DomainException('Choose an active higher subscription plan.');
        }
        $oldPrice = $subscription->period_price_minor ?? $subscription->plan->price_minor;
        $newPrice = $target->price_minor;
        if ($oldPrice === null || $newPrice === null) {
            throw new DomainException('The Super Admin must configure both plan prices first.');
        }
        if ($newPrice <= $oldPrice) {
            throw new DomainException('The higher plan price must exceed the current period price.');
        }
        $now = now();
        $remaining = max(0, (int) $now->diffInSeconds($subscription->current_period_end, false));
        $full = max(1, (int) $subscription->current_period_start->diffInSeconds($subscription->current_period_end));
        if ($remaining <= 0) {
            throw new DomainException('The current period has ended. Renew instead of upgrading.');
        }

        return [
            'newPriceMinor' => (int) $newPrice,
            'oldPriceMinor' => (int) $oldPrice,
            'amountDueMinor' => max(1, (int) ceil(($newPrice - $oldPrice) * $remaining / $full)),
            'expiresAt' => $now->copy()->addDays(7)->min($subscription->current_period_end),
        ];
    }

    public function review(SubscriptionRequest $application, User $reviewer, Request $request, bool $approve, ?string $reason): SubscriptionRequest
    {
        return DB::transaction(function () use ($application, $reviewer, $request, $approve, $reason): SubscriptionRequest {
            $business = Business::query()->lockForUpdate()->findOrFail($application->business_id);
            $application = SubscriptionRequest::query()->with(['desiredPlan', 'fromPlan'])->lockForUpdate()->findOrFail($application->getKey());
            if ($application->status !== 'PENDING_REVIEW') {
                throw new DomainException('Only a pending subscription request can be reviewed.');
            }
            if (! $approve) {
                if (! trim((string) $reason)) {
                    throw new DomainException('A rejection reason is required.');
                }
                $application->update([
                    'status' => 'REJECTED', 'reviewed_by_user_id' => $reviewer->getKey(),
                    'reviewed_at' => now(), 'rejection_reason' => trim($reason),
                ]);
                if ($application->kind === 'INITIAL') {
                    $business->update(['status' => BusinessStatus::Rejected]);
                }
                $this->audit->record('subscription.request_rejected', $request, $reviewer, $business, SubscriptionRequest::class, $application->getKey());

                return $application->fresh(['business', 'desiredPlan.entitlements', 'bill.payments']);
            }

            $plan = $application->desiredPlan;
            if (! $plan->is_active || $plan->price_minor === null) {
                throw new DomainException('Configure and activate the selected plan price before approval.');
            }
            if ($application->kind === 'INITIAL') {
                if ($business->status !== BusinessStatus::Pending || $business->subscription()->exists()) {
                    throw new DomainException('This business is no longer awaiting initial approval.');
                }
                $subscription = Subscription::query()->create([
                    'business_id' => $business->getKey(), 'subscription_plan_id' => $plan->getKey(),
                    'status' => SubscriptionStatus::Active, 'starts_at' => now(),
                    'current_period_start' => now(), 'current_period_end' => now()->addMonthNoOverflow(),
                    'period_price_minor' => $plan->price_minor,
                ]);
                $amount = (int) $plan->price_minor;
                $application->update(['plan_price_minor' => $amount, 'amount_due_minor' => $amount, 'quote_expires_at' => now()->addDays(30)]);
            } else {
                $subscription = Subscription::query()->with('plan')->where('business_id', $business->getKey())->lockForUpdate()->firstOrFail();
                if ($business->status !== BusinessStatus::Active
                    || $subscription->subscription_plan_id !== $application->from_plan_id
                    || ! $subscription->current_period_end->equalTo($application->period_end_snapshot)
                    || ! $application->quote_expires_at?->isFuture()) {
                    throw new DomainException('The upgrade quote is stale. Ask the owner to request a new quote.');
                }
                $amount = (int) $application->amount_due_minor;
            }

            if ($amount > 0 && ! PlatformWallet::query()->where('is_active', true)->exists()) {
                throw new DomainException('Configure an active OrderSync receiving wallet before requesting payment.');
            }
            $application->update(['reviewed_by_user_id' => $reviewer->getKey(), 'reviewed_at' => now()]);
            if ($amount === 0) {
                $this->complete($application, $subscription, $business, $reviewer, $request);
            } else {
                BillingRecord::query()->create([
                    'business_id' => $business->getKey(), 'subscription_id' => $subscription->getKey(),
                    'subscription_request_id' => $application->getKey(), 'amount_minor' => $amount,
                    'currency' => 'PHP', 'status' => BillingStatus::Pending,
                    'period_start' => now(),
                    'period_end' => $application->kind === 'INITIAL' ? now()->addMonthNoOverflow() : $subscription->current_period_end,
                    'due_at' => $application->quote_expires_at,
                    'notes' => $application->kind === 'UPGRADE' ? 'Prorated upgrade; renewal date unchanged.' : 'Initial subscription; starts after verified payment.',
                ]);
                $application->update(['status' => 'AWAITING_PAYMENT']);
            }
            $this->audit->record('subscription.request_reviewed', $request, $reviewer, $business, SubscriptionRequest::class, $application->getKey(), [
                'kind' => $application->kind, 'amount_minor' => $amount,
            ]);

            return $application->fresh(['business', 'desiredPlan.entitlements', 'fromPlan.entitlements', 'bill.payments']);
        });
    }

    public function cancelUpgrade(SubscriptionRequest $application, User $owner, Request $request): SubscriptionRequest
    {
        return DB::transaction(function () use ($application, $owner, $request): SubscriptionRequest {
            $application = SubscriptionRequest::query()->with('bill')->lockForUpdate()->findOrFail($application->getKey());
            if ($application->kind !== 'UPGRADE' || $application->requested_by_user_id !== $owner->getKey()
                || ! in_array($application->status, ['PENDING_REVIEW', 'AWAITING_PAYMENT'], true)
                || ($application->bill && $application->bill->payments()->where('status', '!=', 'REJECTED')->exists())) {
                throw new DomainException('This upgrade cannot be cancelled while a payment needs resolution.');
            }
            $application->bill?->update(['status' => BillingStatus::Void]);
            $application->update(['status' => 'CANCELLED']);
            $this->audit->record('subscription.upgrade_cancelled', $request, $owner, $application->business, SubscriptionRequest::class, $application->getKey());

            return $application->fresh(['business', 'desiredPlan.entitlements', 'fromPlan.entitlements', 'bill.payments']);
        });
    }

    public function onPaymentSubmitted(BillingRecord $bill): void
    {
        if ($bill->subscription_request_id !== null) {
            SubscriptionRequest::query()->whereKey($bill->subscription_request_id)
                ->where('status', 'AWAITING_PAYMENT')->update(['status' => 'PAYMENT_SUBMITTED']);
        }
    }

    public function onPaymentReviewed(BillingRecord $bill, User $reviewer, Request $request, bool $verified): void
    {
        if ($bill->subscription_request_id === null) {
            return;
        }
        if (! $verified) {
            SubscriptionRequest::query()->whereKey($bill->subscription_request_id)
                ->where('status', 'PAYMENT_SUBMITTED')->update(['status' => 'AWAITING_PAYMENT']);

            return;
        }
        $application = SubscriptionRequest::query()->lockForUpdate()->findOrFail($bill->subscription_request_id);
        $business = Business::query()->lockForUpdate()->findOrFail($application->business_id);
        $subscription = Subscription::query()->where('business_id', $business->getKey())->lockForUpdate()->firstOrFail();
        if ($application->status !== 'PAYMENT_SUBMITTED' || $bill->status !== BillingStatus::Paid) {
            throw new DomainException('The subscription request is not ready for activation.');
        }
        $confirmedPayment = RecordedPayment::query()->where('billing_record_id', $bill->getKey())
            ->where('status', 'VERIFIED')->latest('submitted_at')->first();
        if (! $confirmedPayment || $confirmedPayment->submitted_at->greaterThan($application->quote_expires_at)) {
            throw new DomainException('The proof was submitted after the quote expired; resolve the payment before changing the plan.');
        }
        if ($application->kind === 'UPGRADE'
            && ($subscription->subscription_plan_id !== $application->from_plan_id
                || ! $subscription->current_period_end->equalTo($application->period_end_snapshot))) {
            throw new DomainException('The current subscription changed; resolve the payment before upgrading.');
        }
        $this->complete($application, $subscription, $business, $reviewer, $request);
    }

    private function complete(SubscriptionRequest $application, Subscription $subscription, Business $business, User $actor, Request $request): void
    {
        $now = now();
        if ($application->kind === 'INITIAL') {
            $periodEnd = $now->copy()->addMonthNoOverflow();
            $business->update(['status' => BusinessStatus::Active, 'approved_at' => $now]);
            $this->audit->record('business.approved', $request, $actor, $business, Business::class, $business->getKey(), [
                'plan_code' => $application->desiredPlan->code, 'subscription_request_id' => $application->getKey(),
            ]);
            $subscription->update([
                'starts_at' => $now, 'current_period_start' => $now, 'current_period_end' => $periodEnd,
                'period_price_minor' => $application->plan_price_minor,
            ]);
            $application->bill?->update(['period_start' => $now, 'period_end' => $periodEnd]);
            $fromPlan = null;
        } else {
            $fromPlan = $subscription->plan->code;
            $subscription->update([
                'subscription_plan_id' => $application->desired_plan_id,
                'period_price_minor' => $application->plan_price_minor,
            ]);
        }
        $application->update(['status' => 'APPROVED', 'completed_at' => $now]);
        SubscriptionEvent::query()->create([
            'business_id' => $business->getKey(), 'subscription_id' => $subscription->getKey(),
            'actor_user_id' => $actor->getKey(),
            'event_type' => $application->kind === 'INITIAL' ? 'subscription.started' : 'subscription.upgraded',
            'from_status' => $application->kind === 'INITIAL' ? null : SubscriptionStatus::Active->value,
            'to_status' => SubscriptionStatus::Active->value,
            'from_plan_code' => $fromPlan, 'to_plan_code' => $application->desiredPlan->code,
            'metadata' => ['subscription_request_id' => $application->getKey(), 'amount_minor' => $application->amount_due_minor],
            'created_at' => $now,
        ]);
        $this->audit->record('subscription.request_completed', $request, $actor, $business, SubscriptionRequest::class, $application->getKey(), [
            'kind' => $application->kind, 'plan_code' => $application->desiredPlan->code, 'amount_minor' => $application->amount_due_minor,
        ]);
    }
}
