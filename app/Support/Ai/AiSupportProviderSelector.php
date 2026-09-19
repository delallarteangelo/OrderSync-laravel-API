<?php

namespace App\Support\Ai;

use App\Contracts\AiSupportProvider;
use App\Enums\BusinessStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Business;

class AiSupportProviderSelector
{
    public function __construct(
        private readonly AiSupportProvider $configuredProvider,
        private readonly LocalGroundedAiProvider $localProvider,
    ) {}

    public function forBusiness(Business $business, ?string $question = null): AiSupportProvider
    {
        if ($this->configuredProvider->code() !== 'GEMINI'
            || ! $this->hasEffectiveAiSupportEntitlement($business)) {
            return $this->localProvider;
        }

        // Customer-specific topics always stay inside OrderSync, regardless of the
        // Google billing tier. Gemini is reserved for public store information.
        if ($question !== null
            && preg_match('/\b(order|status|ready|payment|address|profile|account|refund|proof|receipt|password|credential|login|my|mine)\b/iu', $question) === 1) {
            return $this->localProvider;
        }

        return $this->configuredProvider;
    }

    private function hasEffectiveAiSupportEntitlement(Business $business): bool
    {
        if ($business->status !== BusinessStatus::Active) {
            return false;
        }

        $business->loadMissing('subscription.plan.entitlements');
        $subscription = $business->subscription;
        if (! $subscription
            || ! in_array($subscription->effectiveStatus(), [SubscriptionStatus::Active, SubscriptionStatus::Grace], true)) {
            return false;
        }

        return $subscription->plan->entitlements
            ->firstWhere('key', 'ai_support_enabled')?->pivot->value === 'true';
    }
}
