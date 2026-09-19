<?php

namespace App\Services;

use App\Enums\BillingStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\RecordedPaymentContext;
use App\Enums\RecordedPaymentStatus;
use App\Enums\UserNotificationType;
use App\Exceptions\RecordedPaymentException;
use App\Models\BillingRecord;
use App\Models\Order;
use App\Models\PaymentInstruction;
use App\Models\PlatformWallet;
use App\Models\RecordedPayment;
use App\Models\User;
use App\Support\Database\DatabaseDialect;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class RecordedPaymentService
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly MessagingService $messaging,
        private readonly SubscriptionRequestService $applications,
        private readonly OrderSettlementService $settlement,
    ) {}

    public function submitOrderPayment(Order $order, User $customer, Request $request, PaymentMethod $method, string $reference, UploadedFile $proof, ?int $claimedAmountMinor = null): RecordedPayment
    {
        if ($order->customer_user_id !== $customer->getKey()) {
            throw new RecordedPaymentException('PAYMENT_NOT_FOUND', 'Payment target not found.', 404);
        }

        return $this->submit(
            $order->business_id,
            RecordedPaymentContext::CustomerOrder,
            $order,
            $customer,
            $request,
            $method,
            $reference,
            $proof,
            $claimedAmountMinor,
        );
    }

    public function submitSubscriptionPayment(BillingRecord $billing, User $owner, Request $request, PaymentMethod $method, string $reference, UploadedFile $proof): RecordedPayment
    {
        return $this->submit(
            $billing->business_id,
            RecordedPaymentContext::Subscription,
            $billing,
            $owner,
            $request,
            $method,
            $reference,
            $proof,
        );
    }

    /** @param Order|BillingRecord $parent */
    private function submit(int $businessId, RecordedPaymentContext $context, mixed $parent, User $submitter, Request $request, PaymentMethod $method, string $reference, UploadedFile $proof, ?int $claimedAmountMinor = null): RecordedPayment
    {
        $reference = trim($reference);
        $hash = hash_file('sha256', $proof->getRealPath());
        if (! is_string($hash)) {
            throw new RuntimeException('The proof could not be read.');
        }
        $path = $proof->storeAs(
            "payment-proofs/{$businessId}",
            Str::uuid().'.'.mb_strtolower($proof->extension()),
            'local',
        );
        if (! is_string($path)) {
            throw new RuntimeException('The proof could not be stored.');
        }

        $referenceScope = $context === RecordedPaymentContext::Subscription ? 'platform' : (string) $businessId;
        $lockKey = "recorded-payment:{$referenceScope}:{$method->value}:".mb_strtolower($reference).":{$hash}";

        try {
            return DatabaseDialect::withTransactionLock($lockKey, function () use ($businessId, $context, $parent, $submitter, $request, $method, $reference, $proof, $hash, $path, $claimedAmountMinor): RecordedPayment {
                if ($context === RecordedPaymentContext::CustomerOrder) {
                    $locked = Order::query()->lockForUpdate()->findOrFail($parent->getKey());
                    if (! in_array($locked->status, [OrderStatus::Pending, OrderStatus::Confirmed, OrderStatus::Preparing, OrderStatus::ReadyForPickup], true)) {
                        throw new RecordedPaymentException('ORDER_PAYMENT_NOT_ALLOWED', 'This order no longer accepts payment proofs.');
                    }
                    if (! PaymentInstruction::query()->where('business_id', $businessId)->where('method', $method->value)->where('is_active', true)->exists()) {
                        throw new RecordedPaymentException('PAYMENT_METHOD_UNAVAILABLE', 'This wallet method is not currently available for this business.', 422);
                    }
                    if ($locked->payments()->where('status', RecordedPaymentStatus::Submitted->value)->exists()) {
                        throw new RecordedPaymentException('PAYMENT_ALREADY_ACTIVE', 'Review the outstanding proof before uploading another.');
                    }
                    $balance = $this->settlement->summary($locked)['balance'];
                    $amountMinor = $claimedAmountMinor ?? $balance;
                    if ($amountMinor < 1 || $amountMinor > $balance) {
                        throw new RecordedPaymentException('AMOUNT_EXCEEDS_BALANCE', 'The claimed amount must be greater than zero and no greater than the remaining balance.', 422);
                    }
                    $parentValues = ['order_id' => $locked->getKey(), 'billing_record_id' => null];
                    $business = $locked->business;
                } else {
                    $locked = BillingRecord::query()->lockForUpdate()->findOrFail($parent->getKey());
                    if (! in_array($locked->status, [BillingStatus::Pending, BillingStatus::Overdue], true)) {
                        throw new RecordedPaymentException('BILLING_PAYMENT_NOT_ALLOWED', 'This billing record is not awaiting payment.');
                    }
                    if ($locked->subscription_request_id !== null) {
                        $application = $locked->subscriptionRequest;
                        if ($application?->status !== 'AWAITING_PAYMENT' || ! $application->quote_expires_at?->isFuture()) {
                            throw new RecordedPaymentException('SUBSCRIPTION_QUOTE_EXPIRED', 'This subscription quote is no longer open for payment.', 409);
                        }
                        if (! PlatformWallet::query()->where('method', $method->value)->where('is_active', true)->exists()) {
                            throw new RecordedPaymentException('PAYMENT_METHOD_UNAVAILABLE', 'This OrderSync receiving wallet is not active.', 422);
                        }
                    }
                    if ($locked->payments()->whereIn('status', [RecordedPaymentStatus::Submitted->value, RecordedPaymentStatus::Verified->value])->exists()) {
                        throw new RecordedPaymentException('PAYMENT_ALREADY_ACTIVE', 'This bill already has a submitted or verified payment.');
                    }
                    $amountMinor = $locked->amount_minor;
                    $parentValues = ['order_id' => null, 'billing_record_id' => $locked->getKey()];
                    $business = $locked->business;
                }

                $referenceDuplicate = RecordedPayment::query()
                    ->when($context === RecordedPaymentContext::Subscription,
                        fn ($query) => $query->where('context', RecordedPaymentContext::Subscription->value),
                        fn ($query) => $query->where('business_id', $businessId))
                    ->where('method', $method->value)
                    ->whereRaw('LOWER(reference_number) = ?', [mb_strtolower($reference)])
                    ->oldest('id')->first();
                $proofDuplicate = RecordedPayment::query()
                    ->when($context === RecordedPaymentContext::Subscription,
                        fn ($query) => $query->where('context', RecordedPaymentContext::Subscription->value),
                        fn ($query) => $query->where('business_id', $businessId))
                    ->where('proof_sha256', $hash)
                    ->oldest('id')->first();
                $duplicate = $referenceDuplicate ?? $proofDuplicate;
                $payment = RecordedPayment::query()->create([
                    'business_id' => $businessId,
                    'context' => $context,
                    ...$parentValues,
                    'submitted_by_user_id' => $submitter->getKey(),
                    'method' => $method,
                    'reference_number' => $reference,
                    'amount_minor' => $amountMinor,
                    'currency' => 'PHP',
                    'status' => RecordedPaymentStatus::Submitted,
                    'proof_disk' => 'local',
                    'proof_path' => $path,
                    'proof_mime_type' => $proof->getMimeType() ?: 'application/octet-stream',
                    'proof_size_bytes' => $proof->getSize(),
                    'proof_sha256' => $hash,
                    'duplicate_reference' => $referenceDuplicate !== null,
                    'duplicate_proof' => $proofDuplicate !== null,
                    'duplicate_of_payment_id' => $duplicate?->getKey(),
                    'submitted_at' => now(),
                    'retained_until' => now()->addDays((int) config('ordersync.payment_proof_retention_days')),
                ]);
                $payment->reviewEvents()->create([
                    'business_id' => $businessId,
                    'actor_user_id' => $submitter->getKey(),
                    'status' => RecordedPaymentStatus::Submitted,
                    'actor_name' => $submitter->name,
                ]);
                $this->audit->record('payment.proof_submitted', $request, $submitter, $business, RecordedPayment::class, $payment->getKey(), [
                    'context' => $context->value,
                    'method' => $method->value,
                    'amount_minor' => $amountMinor,
                    'duplicate_reference' => $referenceDuplicate !== null,
                    'duplicate_proof' => $proofDuplicate !== null,
                ]);
                if ($context === RecordedPaymentContext::CustomerOrder) {
                    $this->messaging->appendOrderActivity(
                        $locked,
                        "{$method->value} payment proof was submitted for manual review.",
                        UserNotificationType::Payment,
                        "Payment proof for {$locked->order_number}",
                        $submitter->getKey(),
                    );
                }
                if ($context === RecordedPaymentContext::Subscription) {
                    $this->applications->onPaymentSubmitted($locked);
                }

                return $payment->fresh(['business', 'order', 'billingRecord', 'submitter', 'reviewEvents']);
            });
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($path);
            throw $exception;
        }
    }

    public function review(RecordedPayment $payment, User $reviewer, Request $request, RecordedPaymentStatus $next, ?string $reason, bool $walletReceiptConfirmed = false, ?int $verifiedAmountMinor = null): RecordedPayment
    {
        if (! in_array($next, [RecordedPaymentStatus::Verified, RecordedPaymentStatus::Rejected], true)) {
            throw new RecordedPaymentException('PAYMENT_REVIEW_INVALID', 'A payment can only be verified or rejected.', 422);
        }
        if ($next === RecordedPaymentStatus::Rejected && ! trim((string) $reason)) {
            throw new RecordedPaymentException('REJECTION_REASON_REQUIRED', 'A rejection reason is required.', 422, ['reason' => ['A rejection reason is required.']]);
        }

        $operation = function () use ($payment, $reviewer, $request, $next, $reason, $walletReceiptConfirmed, $verifiedAmountMinor): RecordedPayment {
            // Order transitions lock the parent first; use the same order to keep review decisions current.
            $order = $payment->context === RecordedPaymentContext::CustomerOrder
                ? Order::query()->lockForUpdate()->findOrFail($payment->order_id)
                : null;
            $locked = RecordedPayment::query()->with(['business', 'order', 'billingRecord'])->lockForUpdate()->findOrFail($payment->getKey());
            if ($locked->status !== RecordedPaymentStatus::Submitted) {
                throw new RecordedPaymentException('PAYMENT_ALREADY_REVIEWED', 'This payment has already been reviewed.');
            }
            if ($locked->context === RecordedPaymentContext::CustomerOrder) {
                $orderStatus = $order->status;
                if ($next === RecordedPaymentStatus::Verified && ! in_array($orderStatus, [OrderStatus::Pending, OrderStatus::Confirmed, OrderStatus::Preparing, OrderStatus::ReadyForPickup], true)) {
                    throw new RecordedPaymentException('ORDER_PAYMENT_NOT_REVIEWABLE', 'This order no longer accepts verified payments.');
                }
                if ($next === RecordedPaymentStatus::Rejected && ! in_array($orderStatus, [OrderStatus::Pending, OrderStatus::Confirmed, OrderStatus::Preparing, OrderStatus::ReadyForPickup], true)) {
                    throw new RecordedPaymentException('ORDER_PAYMENT_NOT_REVIEWABLE', 'This order payment can no longer be reviewed.');
                }
                if ($next === RecordedPaymentStatus::Verified) {
                    if (! $walletReceiptConfirmed) {
                        throw new RecordedPaymentException('WALLET_RECEIPT_NOT_CONFIRMED', 'Check the actual incoming transaction in the business wallet before verification.', 422);
                    }
                    if (RecordedPayment::query()->where('business_id', $locked->business_id)
                        ->where('context', RecordedPaymentContext::CustomerOrder->value)
                        ->where('method', $locked->method->value)
                        ->where('status', RecordedPaymentStatus::Verified->value)
                        ->whereKeyNot($locked->getKey())
                        ->whereRaw('LOWER(reference_number) = ?', [mb_strtolower($locked->reference_number)])
                        ->exists()) {
                        throw new RecordedPaymentException('DUPLICATE_VERIFIED_REFERENCE', 'This wallet reference was already credited to a verified order payment.', 409);
                    }
                    $balance = $this->settlement->summary($order)['balance'];
                    if ($verifiedAmountMinor === null || $verifiedAmountMinor < 1 || $verifiedAmountMinor > $balance) {
                        throw new RecordedPaymentException('VERIFIED_AMOUNT_INVALID', 'Enter the actual received amount, no greater than the remaining order balance.', 422);
                    }
                }
            }
            if ($locked->context === RecordedPaymentContext::Subscription && ! in_array($locked->billingRecord->status, [BillingStatus::Pending, BillingStatus::Overdue], true)) {
                throw new RecordedPaymentException('BILLING_PAYMENT_NOT_REVIEWABLE', 'The billing record is no longer awaiting payment.');
            }
            if ($next === RecordedPaymentStatus::Verified && $locked->context === RecordedPaymentContext::Subscription
                && $locked->billingRecord->subscription_request_id !== null && ! $walletReceiptConfirmed) {
                throw new RecordedPaymentException('WALLET_RECEIPT_NOT_CONFIRMED', 'Confirm the transaction in the receiving wallet before verification.', 422);
            }

            $locked->status = $next;
            $locked->reviewed_by_user_id = $reviewer->getKey();
            $locked->reviewed_at = now();
            $locked->rejection_reason = $next === RecordedPaymentStatus::Rejected ? trim((string) $reason) : null;
            $locked->receipt_number = $next === RecordedPaymentStatus::Verified
                ? 'PAY-'.now()->format('Ymd').'-'.mb_strtoupper(Str::ulid()->toBase32())
                : null;
            if ($next === RecordedPaymentStatus::Verified && $locked->context === RecordedPaymentContext::CustomerOrder) {
                $locked->verified_amount_minor = $verifiedAmountMinor;
            }
            $locked->save();

            if ($next === RecordedPaymentStatus::Verified && $locked->context === RecordedPaymentContext::Subscription) {
                $locked->billingRecord->update([
                    'status' => BillingStatus::Paid,
                    'paid_at' => now(),
                    'reference' => $locked->receipt_number,
                ]);
                $this->audit->record('billing.marked_paid', $request, $reviewer, $locked->business, BillingRecord::class, $locked->billing_record_id, [
                    'amount_minor' => $locked->amount_minor,
                    'currency' => $locked->currency,
                    'recorded_payment_id' => $locked->getKey(),
                ]);
            }
            if ($locked->context === RecordedPaymentContext::Subscription) {
                $this->applications->onPaymentReviewed($locked->billingRecord, $reviewer, $request, $next === RecordedPaymentStatus::Verified);
            }

            $locked->reviewEvents()->create([
                'business_id' => $locked->business_id,
                'actor_user_id' => $reviewer->getKey(),
                'status' => $next,
                'actor_name' => $reviewer->name,
                'note' => $next === RecordedPaymentStatus::Rejected ? trim((string) $reason) : 'Incoming wallet transaction checked; received '.number_format(($locked->verified_amount_minor ?? $locked->amount_minor) / 100, 2).' PHP',
            ]);
            $this->audit->record(
                $next === RecordedPaymentStatus::Verified ? 'payment.manually_verified' : 'payment.rejected',
                $request,
                $reviewer,
                $locked->business,
                RecordedPayment::class,
                $locked->getKey(),
                ['context' => $locked->context->value, 'method' => $locked->method->value, 'claimed_amount_minor' => $locked->amount_minor, 'verified_amount_minor' => $locked->verified_amount_minor],
            );
            $decision = $next === RecordedPaymentStatus::Verified ? 'manually verified' : 'rejected';
            if ($locked->context === RecordedPaymentContext::CustomerOrder) {
                $this->messaging->appendOrderActivity(
                    $locked->order,
                    $next === RecordedPaymentStatus::Verified
                        ? "{$locked->method->value} payment of ₱".number_format($locked->verified_amount_minor / 100, 2).' was verified from the business wallet. Remaining balance: ₱'.number_format($this->settlement->summary($order)['balance'] / 100, 2).'.'
                        : "{$locked->method->value} proof was rejected: ".trim((string) $reason).'. The order remains open for corrected payment proof or cash at pickup.',
                    UserNotificationType::Payment,
                    "Payment {$decision}",
                    $reviewer->getKey(),
                );
            } elseif ($locked->submitter) {
                $this->messaging->notifyUser(
                    $locked->business,
                    $locked->submitter,
                    UserNotificationType::Payment,
                    "Subscription payment {$decision}",
                    "Your {$locked->method->value} subscription proof was {$decision}.",
                    'PAYMENT',
                    (string) $locked->getKey(),
                );
            }

            return $locked->fresh(['business', 'order', 'billingRecord', 'submitter', 'reviewer', 'reviewEvents']);
        };

        if ($next === RecordedPaymentStatus::Verified && $payment->context === RecordedPaymentContext::CustomerOrder) {
            $lockKey = "wallet-receipt:{$payment->business_id}:{$payment->method->value}:".mb_strtolower($payment->reference_number);

            return DatabaseDialect::withTransactionLock($lockKey, $operation);
        }

        return DB::transaction($operation);
    }
}
