<?php

namespace App\Services;

use App\Models\PlatformWallet;
use App\Models\SubscriptionRequest;

class SubscriptionRequestPayload
{
    public static function wallet(PlatformWallet $wallet): array
    {
        return [
            'id' => (string) $wallet->getKey(), 'method' => $wallet->method,
            'accountName' => $wallet->account_name, 'accountNumber' => $wallet->account_number,
            'isActive' => $wallet->is_active,
        ];
    }

    public static function request(SubscriptionRequest $application, bool $includeOwner = false): array
    {
        $application->loadMissing(['business', 'requester', 'desiredPlan.entitlements', 'fromPlan.entitlements', 'bill.payments.submitter', 'bill.payments.reviewer']);
        $bill = $application->bill;

        return [
            'id' => (string) $application->getKey(),
            'businessId' => (string) $application->business_id,
            'businessName' => $application->business->name,
            'kind' => $application->kind,
            'status' => $application->status,
            'desiredPlan' => SaasPayload::plan($application->desiredPlan),
            'fromPlan' => $application->fromPlan ? SaasPayload::plan($application->fromPlan) : null,
            'planPriceMinor' => $application->plan_price_minor,
            'fromPriceMinor' => $application->from_price_minor,
            'amountDueMinor' => $application->amount_due_minor,
            'periodEndSnapshot' => $application->period_end_snapshot?->toIso8601String(),
            'quoteExpiresAt' => $application->quote_expires_at?->toIso8601String(),
            'rejectionReason' => $application->rejection_reason,
            'reviewedAt' => $application->reviewed_at?->toIso8601String(),
            'completedAt' => $application->completed_at?->toIso8601String(),
            'bill' => $bill ? SaasPayload::billingRecord($bill->loadMissing('business')) : null,
            'payments' => $bill ? $bill->payments->map(fn ($payment): array => RecordedPaymentPayload::payment($payment))->all() : [],
            'owner' => $includeOwner ? ['name' => $application->requester->name, 'email' => $application->requester->email] : null,
            'createdAt' => $application->created_at->toIso8601String(),
        ];
    }
}
