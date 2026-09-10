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
use App\Models\RecordedPayment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class RecordedPaymentService
{
    public function __construct(private readonly AuditLogger $audit, private readonly MessagingService $messaging) {}

    public function submitOrderPayment(Order $order, User $customer, Request $request, PaymentMethod $method, string $reference, UploadedFile $proof): RecordedPayment
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
    private function submit(int $businessId, RecordedPaymentContext $context, mixed $parent, User $submitter, Request $request, PaymentMethod $method, string $reference, UploadedFile $proof): RecordedPayment
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

        try {
            return DB::transaction(function () use ($businessId, $context, $parent, $submitter, $request, $method, $reference, $proof, $hash, $path): RecordedPayment {
                DB::select('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', ["recorded-payment:{$businessId}:{$method->value}:".mb_strtolower($reference).":{$hash}"]);
                if ($context === RecordedPaymentContext::CustomerOrder) {
                    $locked = Order::query()->lockForUpdate()->findOrFail($parent->getKey());
                    if ($locked->status !== OrderStatus::Pending) {
                        throw new RecordedPaymentException('ORDER_PAYMENT_NOT_ALLOWED', 'Payment proof can be submitted only while the order is pending.');
                    }
                    if (! PaymentInstruction::query()->where('business_id', $businessId)->where('method', $method->value)->where('is_active', true)->exists()) {
                        throw new RecordedPaymentException('PAYMENT_METHOD_UNAVAILABLE', 'This wallet method is not currently available for this business.', 422);
                    }
                    if ($locked->payments()->whereIn('status', [RecordedPaymentStatus::Submitted->value, RecordedPaymentStatus::Verified->value])->exists()) {
                        throw new RecordedPaymentException('PAYMENT_ALREADY_ACTIVE', 'This order already has a submitted or verified payment.');
                    }
                    $amountMinor = $locked->total_minor;
                    $parentValues = ['order_id' => $locked->getKey(), 'billing_record_id' => null];
                    $business = $locked->business;
                } else {
                    $locked = BillingRecord::query()->lockForUpdate()->findOrFail($parent->getKey());
                    if (! in_array($locked->status, [BillingStatus::Pending, BillingStatus::Overdue], true)) {
                        throw new RecordedPaymentException('BILLING_PAYMENT_NOT_ALLOWED', 'This billing record is not awaiting payment.');
                    }
                    if ($locked->payments()->whereIn('status', [RecordedPaymentStatus::Submitted->value, RecordedPaymentStatus::Verified->value])->exists()) {
                        throw new RecordedPaymentException('PAYMENT_ALREADY_ACTIVE', 'This bill already has a submitted or verified payment.');
                    }
                    $amountMinor = $locked->amount_minor;
                    $parentValues = ['order_id' => null, 'billing_record_id' => $locked->getKey()];
                    $business = $locked->business;
                }

                $referenceDuplicate = RecordedPayment::query()
                    ->where('business_id', $businessId)
                    ->where('method', $method->value)
                    ->whereRaw('LOWER(reference_number) = ?', [mb_strtolower($reference)])
                    ->oldest('id')->first();
                $proofDuplicate = RecordedPayment::query()
                    ->where('business_id', $businessId)
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

                return $payment->fresh(['business', 'order', 'billingRecord', 'submitter', 'reviewEvents']);
            });
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($path);
            throw $exception;
        }
    }

    public function review(RecordedPayment $payment, User $reviewer, Request $request, RecordedPaymentStatus $next, ?string $reason): RecordedPayment
    {
        if (! in_array($next, [RecordedPaymentStatus::Verified, RecordedPaymentStatus::Rejected], true)) {
            throw new RecordedPaymentException('PAYMENT_REVIEW_INVALID', 'A payment can only be verified or rejected.', 422);
        }
        if ($next === RecordedPaymentStatus::Rejected && ! trim((string) $reason)) {
            throw new RecordedPaymentException('REJECTION_REASON_REQUIRED', 'A rejection reason is required.', 422, ['reason' => ['A rejection reason is required.']]);
        }

        return DB::transaction(function () use ($payment, $reviewer, $request, $next, $reason): RecordedPayment {
            $locked = RecordedPayment::query()->with(['business', 'order', 'billingRecord'])->lockForUpdate()->findOrFail($payment->getKey());
            if ($locked->status !== RecordedPaymentStatus::Submitted) {
                throw new RecordedPaymentException('PAYMENT_ALREADY_REVIEWED', 'This payment has already been reviewed.');
            }
            if ($locked->context === RecordedPaymentContext::CustomerOrder && $locked->order->status !== OrderStatus::Pending) {
                throw new RecordedPaymentException('ORDER_PAYMENT_NOT_REVIEWABLE', 'The order is no longer pending.');
            }
            if ($locked->context === RecordedPaymentContext::Subscription && ! in_array($locked->billingRecord->status, [BillingStatus::Pending, BillingStatus::Overdue], true)) {
                throw new RecordedPaymentException('BILLING_PAYMENT_NOT_REVIEWABLE', 'The billing record is no longer awaiting payment.');
            }

            $locked->status = $next;
            $locked->reviewed_by_user_id = $reviewer->getKey();
            $locked->reviewed_at = now();
            $locked->rejection_reason = $next === RecordedPaymentStatus::Rejected ? trim((string) $reason) : null;
            $locked->receipt_number = $next === RecordedPaymentStatus::Verified
                ? 'PAY-'.now()->format('Ymd').'-'.mb_strtoupper(Str::ulid()->toBase32())
                : null;
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

            $locked->reviewEvents()->create([
                'business_id' => $locked->business_id,
                'actor_user_id' => $reviewer->getKey(),
                'status' => $next,
                'actor_name' => $reviewer->name,
                'note' => $next === RecordedPaymentStatus::Rejected ? trim((string) $reason) : 'Manually verified',
            ]);
            $this->audit->record(
                $next === RecordedPaymentStatus::Verified ? 'payment.manually_verified' : 'payment.rejected',
                $request,
                $reviewer,
                $locked->business,
                RecordedPayment::class,
                $locked->getKey(),
                ['context' => $locked->context->value, 'method' => $locked->method->value, 'amount_minor' => $locked->amount_minor],
            );
            $decision = $next === RecordedPaymentStatus::Verified ? 'manually verified' : 'rejected';
            if ($locked->context === RecordedPaymentContext::CustomerOrder) {
                $this->messaging->appendOrderActivity(
                    $locked->order,
                    "{$locked->method->value} payment proof was {$decision}.",
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
        });
    }
}
