<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BillingStatus;
use App\Enums\BusinessStatus;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Models\BillingRecord;
use App\Models\Business;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class PlatformDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $now = now();

        return response()->json([
            'businesses' => [
                'total' => Business::query()->count(),
                'pending' => Business::query()->where('status', BusinessStatus::Pending->value)->count(),
                'active' => Business::query()->where('status', BusinessStatus::Active->value)->count(),
                'suspended' => Business::query()->where('status', BusinessStatus::Suspended->value)->count(),
            ],
            'subscriptions' => [
                'active' => Subscription::query()
                    ->where('status', '!=', SubscriptionStatus::Cancelled->value)
                    ->where('current_period_end', '>', $now)
                    ->count(),
                'grace' => Subscription::query()
                    ->where('status', '!=', SubscriptionStatus::Cancelled->value)
                    ->where('current_period_end', '<=', $now)
                    ->where('grace_ends_at', '>', $now)
                    ->count(),
                'expired' => Subscription::query()
                    ->where('status', '!=', SubscriptionStatus::Cancelled->value)
                    ->where('current_period_end', '<=', $now)
                    ->where(fn ($query) => $query->whereNull('grace_ends_at')->orWhere('grace_ends_at', '<=', $now))
                    ->count(),
            ],
            'users' => [
                'total' => User::query()->count(),
                'active' => User::query()->where('is_active', true)->count(),
            ],
            'billing' => [
                'paidRecords' => BillingRecord::query()->where('status', BillingStatus::Paid->value)->count(),
                'paidAmountMinor' => (int) BillingRecord::query()->where('status', BillingStatus::Paid->value)->sum('amount_minor'),
                'currency' => 'PHP',
            ],
            'system' => [
                'database' => 'ok',
                'checkedAt' => now()->toIso8601String(),
            ],
        ]);
    }
}
