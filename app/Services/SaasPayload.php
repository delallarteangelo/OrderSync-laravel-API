<?php

namespace App\Services;

use App\Models\BillingRecord;
use App\Models\Business;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;

class SaasPayload
{
    /** @return array<string, mixed> */
    public static function business(Business $business): array
    {
        $business->loadMissing(['subscription.plan', 'memberships.user']);
        $owner = $business->memberships->first(fn ($membership) => $membership->role->value === 'BUSINESS_OWNER');

        return [
            'id' => (string) $business->getKey(),
            'name' => $business->name,
            'slug' => $business->slug,
            'timezone' => $business->timezone,
            'status' => $business->status->value,
            'submittedAt' => $business->submitted_at?->toIso8601String(),
            'approvedAt' => $business->approved_at?->toIso8601String(),
            'suspendedAt' => $business->suspended_at?->toIso8601String(),
            'suspensionReason' => $business->suspension_reason,
            'owner' => $owner ? [
                'id' => (string) $owner->user->getKey(),
                'fullName' => $owner->user->name,
                'email' => $owner->user->email,
            ] : null,
            'userCount' => $business->memberships->where('is_active', true)->count(),
            'subscription' => $business->subscription ? self::subscription($business->subscription) : null,
            'createdAt' => $business->created_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public static function plan(SubscriptionPlan $plan): array
    {
        $plan->loadMissing('entitlements');
        $entitlements = [];
        foreach ($plan->entitlements as $entitlement) {
            $entitlements[$entitlement->key] = self::castEntitlement(
                $entitlement->value_type,
                $entitlement->pivot->value,
            );
        }

        return [
            'id' => (string) $plan->getKey(),
            'code' => $plan->code,
            'name' => $plan->name,
            'priceMinor' => $plan->price_minor,
            'currency' => $plan->currency,
            'billingInterval' => $plan->billing_interval,
            'graceDays' => $plan->grace_days,
            'isActive' => $plan->is_active,
            'entitlements' => $entitlements,
        ];
    }

    /** @return array<string, mixed> */
    public static function subscription(Subscription $subscription): array
    {
        $subscription->loadMissing('plan.entitlements');

        return [
            'id' => (string) $subscription->getKey(),
            'businessId' => (string) $subscription->business_id,
            'status' => $subscription->status->value,
            'effectiveStatus' => $subscription->effectiveStatus()->value,
            'startsAt' => $subscription->starts_at->toIso8601String(),
            'currentPeriodStart' => $subscription->current_period_start->toIso8601String(),
            'currentPeriodEnd' => $subscription->current_period_end->toIso8601String(),
            'graceEndsAt' => $subscription->grace_ends_at?->toIso8601String(),
            'cancelledAt' => $subscription->cancelled_at?->toIso8601String(),
            'plan' => self::plan($subscription->plan),
        ];
    }

    /** @return array<string, mixed> */
    public static function billingRecord(BillingRecord $record): array
    {
        return [
            'id' => (string) $record->getKey(),
            'businessId' => (string) $record->business_id,
            'subscriptionId' => (string) $record->subscription_id,
            'businessName' => $record->relationLoaded('business') ? $record->business?->name : null,
            'amountMinor' => $record->amount_minor,
            'currency' => $record->currency,
            'status' => $record->status->value,
            'periodStart' => $record->period_start->toIso8601String(),
            'periodEnd' => $record->period_end->toIso8601String(),
            'dueAt' => $record->due_at->toIso8601String(),
            'paidAt' => $record->paid_at?->toIso8601String(),
            'reference' => $record->reference,
            'notes' => $record->notes,
        ];
    }

    /** @return array<string, mixed> */
    public static function user(User $user): array
    {
        $user->loadMissing('memberships.business');

        return [
            'id' => (string) $user->getKey(),
            'fullName' => $user->name,
            'email' => $user->email,
            'isActive' => $user->is_active,
            'platformRole' => $user->platform_role?->value,
            'memberships' => $user->memberships->map(fn ($membership): array => [
                'businessId' => (string) $membership->business_id,
                'businessName' => $membership->business->name,
                'role' => $membership->role->value,
                'isActive' => $membership->is_active,
            ])->values()->all(),
            'createdAt' => $user->created_at?->toIso8601String(),
        ];
    }

    private static function castEntitlement(string $type, string $value): bool|int|string
    {
        return match ($type) {
            'BOOLEAN' => $value === 'true',
            'INTEGER' => (int) $value,
            default => $value,
        };
    }
}
