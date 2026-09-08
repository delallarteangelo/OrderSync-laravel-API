<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SaasPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantSubscriptionController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $business = $request->attributes->get('currentBusiness');
        $subscription = $business->subscription()->with('plan.entitlements')->first();

        return response()->json([
            'business' => [
                'id' => (string) $business->getKey(),
                'name' => $business->name,
                'status' => $business->status->value,
            ],
            'subscription' => $subscription ? SaasPayload::subscription($subscription) : null,
        ]);
    }
}
