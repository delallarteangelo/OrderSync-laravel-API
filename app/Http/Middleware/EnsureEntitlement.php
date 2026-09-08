<?php

namespace App\Http\Middleware;

use App\Enums\SubscriptionStatus;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEntitlement
{
    public function handle(Request $request, Closure $next, string $entitlementKey): Response
    {
        $business = $request->attributes->get('currentBusiness');
        $subscription = $business?->subscription()->with('plan.entitlements')->first();

        if (! $subscription || ! in_array($subscription->effectiveStatus(), [SubscriptionStatus::Active, SubscriptionStatus::Grace], true)) {
            return response()->json([
                'code' => 'SUBSCRIPTION_INACTIVE',
                'message' => 'An active subscription is required for this feature.',
            ], 403);
        }

        $entitlement = $subscription->plan->entitlements->firstWhere('key', $entitlementKey);
        if (! $entitlement || $entitlement->pivot->value !== 'true') {
            return response()->json([
                'code' => 'ENTITLEMENT_REQUIRED',
                'message' => 'The current subscription does not include this feature.',
            ], 403);
        }

        $request->attributes->set('currentSubscription', $subscription);

        return $next($request);
    }
}
