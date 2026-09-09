<?php

namespace App\Services;

use App\Models\PaymentInstruction;
use App\Models\PaymentReviewEvent;
use App\Models\RecordedPayment;

class RecordedPaymentPayload
{
    /** @return array<string, mixed> */
    public static function instruction(PaymentInstruction $instruction): array
    {
        return [
            'id' => (string) $instruction->getKey(),
            'method' => $instruction->method->value,
            'accountName' => $instruction->account_name,
            'accountNumber' => $instruction->account_number,
            'instructions' => $instruction->instructions,
            'qrAvailable' => $instruction->qr_path !== null,
            'active' => $instruction->is_active,
        ];
    }

    /** @return array<string, mixed> */
    public static function payment(RecordedPayment $payment): array
    {
        $payment->loadMissing(['business', 'order', 'billingRecord', 'submitter', 'reviewer', 'reviewEvents']);

        return [
            'id' => (string) $payment->getKey(),
            'context' => $payment->context->value,
            'business' => [
                'id' => (string) $payment->business_id,
                'name' => $payment->business->name,
            ],
            'orderId' => $payment->order_id === null ? null : (string) $payment->order_id,
            'orderCode' => $payment->order?->order_number,
            'billingRecordId' => $payment->billing_record_id === null ? null : (string) $payment->billing_record_id,
            'payer' => [
                'id' => $payment->submitted_by_user_id === null ? null : (string) $payment->submitted_by_user_id,
                'name' => $payment->submitter?->name ?? 'Former user',
            ],
            'method' => $payment->method->value,
            'referenceNumber' => $payment->reference_number,
            'amount' => $payment->amount_minor / 100,
            'currency' => $payment->currency,
            'status' => $payment->status->value,
            'proofAvailable' => $payment->proof_path !== null && $payment->proof_deleted_at === null,
            'proofMimeType' => $payment->proof_mime_type,
            'duplicateReference' => $payment->duplicate_reference,
            'duplicateProof' => $payment->duplicate_proof,
            'duplicateOfPaymentId' => $payment->duplicate_of_payment_id === null ? null : (string) $payment->duplicate_of_payment_id,
            'receiptNumber' => $payment->receipt_number,
            'rejectionReason' => $payment->rejection_reason,
            'submittedAt' => $payment->submitted_at->toIso8601String(),
            'reviewedAt' => $payment->reviewed_at?->toIso8601String(),
            'reviewedBy' => $payment->reviewer?->name,
            'retainedUntil' => $payment->retained_until->toIso8601String(),
            'proofDeletedAt' => $payment->proof_deleted_at?->toIso8601String(),
            'reviewHistory' => $payment->reviewEvents->sortBy('created_at')->values()->map(fn (PaymentReviewEvent $event): array => [
                'status' => $event->status->value,
                'at' => $event->created_at->toIso8601String(),
                'actorName' => $event->actor_name,
                'note' => $event->note,
            ])->all(),
        ];
    }

    /** @return array<string, mixed> */
    public static function receipt(RecordedPayment $payment): array
    {
        if ($payment->receipt_number === null) {
            abort(409, 'A receipt is available only after verification.');
        }

        return [
            'receiptNumber' => $payment->receipt_number,
            'verifiedAt' => $payment->reviewed_at?->toIso8601String(),
            'businessName' => $payment->business->name,
            'payerName' => $payment->submitter?->name ?? 'Former user',
            'context' => $payment->context->value,
            'orderCode' => $payment->order?->order_number,
            'billingRecordId' => $payment->billing_record_id === null ? null : (string) $payment->billing_record_id,
            'method' => $payment->method->value,
            'referenceNumber' => $payment->reference_number,
            'amount' => $payment->amount_minor / 100,
            'currency' => $payment->currency,
            'providerConfirmed' => false,
            'verification' => 'MANUAL',
        ];
    }
}
