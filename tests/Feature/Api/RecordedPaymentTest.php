<?php

namespace Tests\Feature\Api;

use App\Enums\BillingStatus;
use App\Enums\BusinessStatus;
use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\BillingRecord;
use App\Models\Business;
use App\Models\Category;
use App\Models\InventoryStock;
use App\Models\Membership;
use App\Models\Order;
use App\Models\PaymentInstruction;
use App\Models\Product;
use App\Models\RecordedPayment;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RecordedPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_owner_manages_private_wallet_instructions_visible_only_to_the_tenant(): void
    {
        [$business, $customer, $customerToken, $ownerToken] = $this->tenant('Wallet Store', 'wallet-store');
        [$otherBusiness, , $otherCustomerToken] = $this->tenant('Other Store', 'other-wallet-store');

        $response = $this->withToken($ownerToken)->post('/api/v1/payment-instructions/GCASH', [
            'accountName' => 'Wallet Store Owner',
            'accountNumber' => '09171234567',
            'instructions' => 'Use the order number as your message.',
            'active' => true,
            'qr' => UploadedFile::fake()->image('gcash.png'),
        ])->assertOk()->assertJsonPath('method', 'GCASH')->assertJsonPath('qrAvailable', true);
        $instructionId = $response->json('id');
        $instruction = PaymentInstruction::query()->findOrFail($instructionId);
        Storage::disk('local')->assertExists($instruction->qr_path);

        $this->withToken($customerToken)->getJson('/api/v1/customer/payment-instructions')
            ->assertOk()->assertJsonPath('providerConfirmed', false)->assertJsonPath('items.0.accountNumber', '09171234567');
        $this->withToken($customerToken)->get("/api/v1/customer/payment-instructions/{$instructionId}/qr")->assertOk();
        $this->withToken($otherCustomerToken)->get("/api/v1/customer/payment-instructions/{$instructionId}/qr")->assertNotFound();
        $this->withToken($ownerToken)->post('/api/v1/payment-instructions/GCASH', [
            'accountName' => 'Wallet Store Owner',
            'accountNumber' => '09171234567',
            'active' => false,
        ])->assertOk();
        $this->withToken($customerToken)->getJson('/api/v1/customer/payment-instructions')
            ->assertJsonCount(1, 'items')->assertJsonPath('items.0.method', 'MAYA');
        $this->withToken($customerToken)->get("/api/v1/customer/payment-instructions/{$instructionId}/qr")->assertNotFound();
        $this->withToken($ownerToken)->get("/api/v1/payment-instructions/{$instructionId}/qr")->assertOk();
        $product = $this->product($business, 1000, 2);
        $order = $this->order($business, $customer, $product, 1, 'INACTIVE-WALLET');
        $this->withToken($customerToken)->post("/api/v1/customer/orders/{$order->getKey()}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'INACTIVE-1', 'proof' => UploadedFile::fake()->image('inactive.png'),
        ])->assertUnprocessable()->assertJsonPath('code', 'PAYMENT_METHOD_UNAVAILABLE');
        $this->assertDatabaseHas('audit_logs', ['business_id' => $business->getKey(), 'action' => 'payment.instructions_updated']);
        $this->assertDatabaseHas('payment_instructions', [
            'business_id' => $otherBusiness->getKey(), 'method' => 'GCASH', 'account_name' => 'Other Store',
        ]);
    }

    public function test_order_proof_is_private_manual_and_must_be_verified_before_paid_order_confirmation(): void
    {
        [$business, $customer, $customerToken, $ownerToken] = $this->tenant();
        $product = $this->product($business, 2500, 5);
        $order = $this->order($business, $customer, $product, 2, 'PAY-ORDER-1');
        $proof = UploadedFile::fake()->image('proof.png');

        $submitted = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$order->getKey()}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'GCASH-123', 'proof' => $proof,
        ])->assertCreated()
            ->assertJsonPath('status', 'SUBMITTED')
            ->assertJsonPath('amount', 50)
            ->assertJsonPath('proofAvailable', true)
            ->assertJsonPath('duplicateReference', false)
            ->assertJsonPath('duplicateProof', false)
            ->assertJsonPath('reviewHistory.0.status', 'SUBMITTED');
        $paymentId = $submitted->json('id');
        $payment = RecordedPayment::query()->findOrFail($paymentId);
        Storage::disk('local')->assertExists($payment->proof_path);
        $this->assertStringStartsWith('payment-proofs/', $payment->proof_path);
        $this->withToken($ownerToken)->getJson("/api/v1/orders/{$order->getKey()}")
            ->assertOk()
            ->assertJsonPath('payments.0.id', $paymentId)
            ->assertJsonPath('payments.0.status', 'SUBMITTED')
            ->assertJsonPath('payments.0.proofAvailable', true);
        $this->withToken($ownerToken)->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonPath('items.0.payments.0.id', $paymentId);

        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/transition", ['next' => 'CONFIRMED'])
            ->assertStatus(409)->assertJsonPath('code', 'PAYMENT_NOT_VERIFIED');
        $this->withToken($ownerToken)->get("/api/v1/payments/{$paymentId}/proof")->assertOk();
        $this->withToken($customerToken)->get("/api/v1/customer/payments/{$paymentId}/proof")->assertOk();

        $reviewed = $this->withToken($ownerToken)->postJson("/api/v1/payments/{$paymentId}/review", ['decision' => 'VERIFIED', 'verifiedAmountMinor' => 5000, 'walletReceiptConfirmed' => true])
            ->assertOk()->assertJsonPath('status', 'VERIFIED')->assertJsonPath('verifiedAmount', 50);
        $receipt = $reviewed->json('receiptNumber');
        $this->assertNotEmpty($receipt);
        $this->withToken($customerToken)->getJson("/api/v1/customer/payments/{$paymentId}/receipt")
            ->assertOk()->assertJsonPath('receiptNumber', $receipt)->assertJsonPath('providerConfirmed', false)->assertJsonPath('verification', 'MANUAL');

        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/transition", ['next' => 'CONFIRMED'])
            ->assertOk()->assertJsonPath('status', 'CONFIRMED');
        $this->assertDatabaseHas('inventory_stocks', ['product_id' => $product->getKey(), 'quantity' => 3, 'version' => 1]);
        $this->assertDatabaseCount('inventory_movements', 1);
        $this->assertDatabaseHas('audit_logs', ['action' => 'payment.proof_submitted']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'payment.manually_verified']);
        $this->assertDatabaseHas('user_notifications', ['business_id' => $business->getKey(), 'user_id' => $customer->getKey(), 'type' => 'PAYMENT']);
    }

    public function test_submitted_proof_must_be_reviewed_before_order_rejection(): void
    {
        [$business, $customer, $customerToken, $ownerToken] = $this->tenant();
        $product = $this->product($business, 13000, 2);
        $order = $this->order($business, $customer, $product, 1, 'REJECT-BEFORE-PAYMENT-REVIEW');
        $paymentId = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$order->getKey()}/payments", [
            'method' => 'MAYA', 'referenceNumber' => 'REJECT-ORDER-1', 'proof' => UploadedFile::fake()->image('proof.png'),
        ])->assertCreated()->json('id');

        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/transition", [
            'next' => 'REJECTED', 'note' => 'Item unavailable',
        ])->assertStatus(409)->assertJsonPath('code', 'PAYMENT_REVIEW_PENDING');
        $this->withToken($ownerToken)->getJson('/api/v1/payments')->assertOk()
            ->assertJsonPath('items.0.status', 'SUBMITTED')
            ->assertJsonPath('items.0.orderStatus', 'PENDING');
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$paymentId}/review", ['decision' => 'VERIFIED'])
            ->assertStatus(422)->assertJsonPath('code', 'WALLET_RECEIPT_NOT_CONFIRMED');
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$paymentId}/review", [
            'decision' => 'REJECTED', 'reason' => 'Order rejected; payment not accepted',
        ])->assertOk()->assertJsonPath('status', 'REJECTED')->assertJsonPath('orderStatus', 'PENDING');
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/transition", [
            'next' => 'REJECTED', 'note' => 'Item unavailable',
        ])->assertOk()->assertJsonPath('status', 'REJECTED');

        $this->assertDatabaseHas('recorded_payments', ['id' => $paymentId, 'status' => 'REJECTED', 'receipt_number' => null]);
        $this->assertDatabaseHas('payment_review_events', ['recorded_payment_id' => $paymentId, 'status' => 'REJECTED']);
        $this->assertDatabaseHas('audit_logs', ['business_id' => $business->getKey(), 'action' => 'payment.rejected', 'subject_id' => (string) $paymentId]);
    }

    public function test_verified_payment_moves_rejection_to_refund_pending(): void
    {
        [$business, $customer, $customerToken, $ownerToken] = $this->tenant();
        $product = $this->product($business, 1000, 2);
        $order = $this->order($business, $customer, $product, 1, 'PAID-ORDER-CANNOT-REJECT');
        $paymentId = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$order->getKey()}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'VERIFIED-ORDER-1', 'proof' => UploadedFile::fake()->image('paid.png'),
        ])->assertCreated()->json('id');
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$paymentId}/review", ['decision' => 'VERIFIED', 'verifiedAmountMinor' => 1000, 'walletReceiptConfirmed' => true])
            ->assertOk()->assertJsonPath('status', 'VERIFIED');

        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/transition", [
            'next' => 'REJECTED', 'note' => 'No stock',
        ])->assertOk()->assertJsonPath('status', 'REFUND_PENDING')->assertJsonPath('financialStatus', 'REFUND_PENDING')->assertJsonPath('balanceDue', 0);
        $this->assertDatabaseHas('orders', ['id' => $order->getKey(), 'status' => 'REFUND_PENDING']);
    }

    public function test_short_wallet_receipt_can_be_topped_up_or_settled_at_pickup(): void
    {
        [$business, $customer, $customerToken, $ownerToken] = $this->tenant();
        $order = $this->order($business, $customer, $this->product($business, 7000, 3), 1, 'PARTIAL-WALLET-1');
        $id = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$order->getKey()}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'PARTIAL-CLAIM', 'claimedAmountMinor' => 5000,
            'proof' => UploadedFile::fake()->image('claim.png'),
        ])->assertCreated()->assertJsonPath('amount', 50)->json('id');
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$id}/review", [
            'decision' => 'VERIFIED', 'walletReceiptConfirmed' => true, 'verifiedAmountMinor' => 3000,
        ])->assertOk()->assertJsonPath('verifiedAmount', 30);
        $this->withToken($customerToken)->getJson("/api/v1/customer/orders/{$order->getKey()}")
            ->assertOk()->assertJsonPath('financialStatus', 'PARTIALLY_PAID')->assertJsonPath('balanceDue', 40);

        $this->withToken($customerToken)->patchJson("/api/v1/customer/orders/{$order->getKey()}/balance-method", ['method' => 'WALLET_TOPUP'])
            ->assertOk()->assertJsonPath('balanceCollectionMethod', 'WALLET_TOPUP');
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/transition", ['next' => 'CONFIRMED'])
            ->assertStatus(409)->assertJsonPath('code', 'TOPUP_REQUIRED');
        $secondId = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$order->getKey()}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'PARTIAL-TOPUP', 'claimedAmountMinor' => 4000,
            'proof' => UploadedFile::fake()->image('topup.png'),
        ])->assertCreated()->json('id');
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$secondId}/review", [
            'decision' => 'VERIFIED', 'walletReceiptConfirmed' => true, 'verifiedAmountMinor' => 4000,
        ])->assertOk();
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/transition", ['next' => 'CONFIRMED'])
            ->assertOk()->assertJsonPath('balanceDue', 0)->assertJsonPath('financialStatus', 'PAID');

        $cashOrder = $this->order($business, $customer, $this->product($business, 6000, 3), 1, 'PARTIAL-CASH-2');
        $cashId = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$cashOrder->getKey()}/payments", [
            'method' => 'MAYA', 'referenceNumber' => 'CASH-CLAIM', 'claimedAmountMinor' => 2000,
            'proof' => UploadedFile::fake()->image('cash.png'),
        ])->assertCreated()->json('id');
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$cashId}/review", [
            'decision' => 'VERIFIED', 'walletReceiptConfirmed' => true, 'verifiedAmountMinor' => 2000,
        ])->assertOk();
        foreach (['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] as $status) {
            $this->withToken($ownerToken)->postJson("/api/v1/orders/{$cashOrder->getKey()}/transition", ['next' => $status])->assertOk();
        }
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$cashOrder->getKey()}/transition", ['next' => 'COMPLETED'])
            ->assertStatus(409)->assertJsonPath('code', 'BALANCE_DUE');
        $outstandingId = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$cashOrder->getKey()}/payments", [
            'method' => 'MAYA', 'referenceNumber' => 'CASH-OUTSTANDING', 'claimedAmountMinor' => 4000,
            'proof' => UploadedFile::fake()->image('outstanding.png'),
        ])->assertCreated()->json('id');
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$cashOrder->getKey()}/counter-payments", [
            'amountMinor' => 4000, 'referenceNumber' => 'COUNTER-RECEIPT-1',
        ])->assertStatus(409)->assertJsonPath('code', 'PAYMENT_REVIEW_PENDING');
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$outstandingId}/review", [
            'decision' => 'REJECTED', 'reason' => 'No second incoming wallet transaction found',
        ])->assertOk();
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$cashOrder->getKey()}/counter-payments", [
            'amountMinor' => 4000, 'referenceNumber' => 'COUNTER-RECEIPT-1',
        ])->assertOk()->assertJsonPath('counterPaid', 40)->assertJsonPath('balanceDue', 0);
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$cashOrder->getKey()}/transition", ['next' => 'COMPLETED'])
            ->assertOk()->assertJsonPath('status', 'COMPLETED');
    }

    public function test_received_money_requires_actual_refund_reference_before_closure(): void
    {
        [$business, $customer, $customerToken, $ownerToken] = $this->tenant();
        $order = $this->order($business, $customer, $this->product($business, 1000, 2), 1, 'REFUND-MANUAL-1');
        $id = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$order->getKey()}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'REFUND-IN-1', 'proof' => UploadedFile::fake()->image('paid.png'),
        ])->assertCreated()->json('id');
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$id}/review", [
            'decision' => 'VERIFIED', 'walletReceiptConfirmed' => true, 'verifiedAmountMinor' => 1000,
        ])->assertOk();
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/transition", ['next' => 'REJECTED', 'note' => 'Item unavailable'])
            ->assertOk()->assertJsonPath('status', 'REFUND_PENDING');
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/refund", [
            'method' => 'GCASH', 'referenceNumber' => 'REFUND-OUT-1', 'amountMinor' => 1000,
        ])->assertUnprocessable();
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/refund", [
            'method' => 'GCASH', 'referenceNumber' => 'REFUND-OUT-1', 'amountMinor' => 400, 'refundConfirmed' => true,
        ])->assertOk()->assertJsonPath('status', 'REFUND_PENDING')->assertJsonPath('refundedAmount', 4);
        $this->withToken($ownerToken)->postJson("/api/v1/orders/{$order->getKey()}/refund", [
            'method' => 'MAYA', 'referenceNumber' => 'REFUND-OUT-2', 'amountMinor' => 600, 'refundConfirmed' => true,
        ])->assertOk()->assertJsonPath('status', 'REFUNDED')->assertJsonPath('financialStatus', 'REFUNDED');
        $this->assertDatabaseHas('order_refunds', ['business_id' => $business->getKey(), 'order_id' => $order->getKey(), 'amount_minor' => 400]);
        $this->assertDatabaseHas('order_refunds', ['business_id' => $business->getKey(), 'order_id' => $order->getKey(), 'amount_minor' => 600]);
    }

    public function test_duplicate_signals_rejection_resubmission_and_tenant_boundaries_are_enforced(): void
    {
        [$business, $customer, $customerToken, $ownerToken] = $this->tenant();
        $product = $this->product($business, 1000, 8);
        $firstOrder = $this->order($business, $customer, $product, 1, 'DUP-1');
        $secondOrder = $this->order($business, $customer, $product, 1, 'DUP-2');
        [$otherBusiness, , , $otherOwnerToken] = $this->tenant('Other Store', 'other-store-payments');
        $content = UploadedFile::fake()->image('first.png')->getContent();

        $firstId = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$firstOrder->getKey()}/payments", [
            'method' => 'MAYA', 'referenceNumber' => 'MAYA-DUPLICATE', 'proof' => UploadedFile::fake()->createWithContent('first.png', $content),
        ])->assertCreated()->json('id');
        $secondId = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$secondOrder->getKey()}/payments", [
            'method' => 'MAYA', 'referenceNumber' => 'maya-duplicate', 'proof' => UploadedFile::fake()->createWithContent('second.png', $content),
        ])->assertCreated()->assertJsonPath('duplicateReference', true)->assertJsonPath('duplicateProof', true)->assertJsonPath('duplicateOfPaymentId', $firstId)->json('id');

        $this->withToken($otherOwnerToken)->getJson("/api/v1/payments/{$secondId}/receipt")->assertNotFound();
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$firstId}/review", [
            'decision' => 'VERIFIED', 'walletReceiptConfirmed' => true, 'verifiedAmountMinor' => 1000,
        ])->assertOk();
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$secondId}/review", [
            'decision' => 'VERIFIED', 'walletReceiptConfirmed' => true, 'verifiedAmountMinor' => 1000,
        ])->assertStatus(409)->assertJsonPath('code', 'DUPLICATE_VERIFIED_REFERENCE');
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$secondId}/review", ['decision' => 'REJECTED'])
            ->assertUnprocessable()->assertJsonPath('code', 'REJECTION_REASON_REQUIRED');
        $this->withToken($ownerToken)->postJson("/api/v1/payments/{$secondId}/review", ['decision' => 'REJECTED', 'reason' => 'Duplicate proof'])
            ->assertOk()->assertJsonPath('status', 'REJECTED')->assertJsonPath('rejectionReason', 'Duplicate proof');
        $this->withToken($customerToken)->post("/api/v1/customer/orders/{$secondOrder->getKey()}/payments", [
            'method' => 'MAYA', 'referenceNumber' => 'MAYA-NEW', 'proof' => UploadedFile::fake()->image('new.png'),
        ])->assertCreated()->assertJsonPath('status', 'SUBMITTED');
        $this->assertDatabaseHas('recorded_payments', ['business_id' => $business->getKey(), 'id' => $secondId, 'status' => 'REJECTED']);
        $this->assertDatabaseMissing('recorded_payments', ['business_id' => $otherBusiness->getKey()]);
    }

    public function test_subscription_proof_is_submitted_by_owner_and_verified_only_by_super_admin(): void
    {
        [$business, , , $ownerToken] = $this->tenant();
        [, , , $otherOwnerToken] = $this->tenant('Other Billing Store', 'other-billing-store');
        $billing = BillingRecord::query()->create([
            'business_id' => $business->getKey(),
            'subscription_id' => $business->subscription->getKey(),
            'amount_minor' => 99900,
            'currency' => 'PHP',
            'status' => BillingStatus::Pending,
            'period_start' => now(),
            'period_end' => now()->addMonth(),
            'due_at' => now()->addWeek(),
        ]);
        $admin = User::factory()->create(['platform_role' => Role::SuperAdmin]);
        $adminToken = $this->postJson('/api/v1/auth/login', ['email' => $admin->email, 'password' => 'password'])->assertOk()->json('accessToken');

        $this->withToken($otherOwnerToken)->post("/api/v1/tenant/billing-records/{$billing->getKey()}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'SUB-FOREIGN', 'proof' => UploadedFile::fake()->image('foreign.png'),
        ])->assertNotFound();
        $paymentId = $this->withToken($ownerToken)->post("/api/v1/tenant/billing-records/{$billing->getKey()}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'SUB-100', 'proof' => UploadedFile::fake()->image('subscription.png'),
        ])->assertCreated()->assertJsonPath('context', 'SUBSCRIPTION')->json('id');
        $this->withToken($ownerToken)->postJson("/api/v1/platform/payments/{$paymentId}/review", ['decision' => 'VERIFIED'])->assertForbidden();
        $receipt = $this->withToken($adminToken)->postJson("/api/v1/platform/payments/{$paymentId}/review", ['decision' => 'VERIFIED'])
            ->assertOk()->assertJsonPath('status', 'VERIFIED')->json('receiptNumber');

        $this->assertDatabaseHas('billing_records', ['id' => $billing->getKey(), 'status' => 'PAID', 'reference' => $receipt]);
        $this->withToken($ownerToken)->getJson("/api/v1/tenant/payments/{$paymentId}/receipt")
            ->assertOk()->assertJsonPath('verification', 'MANUAL');
        $this->assertDatabaseHas('audit_logs', ['action' => 'billing.marked_paid']);
    }

    public function test_retention_command_deletes_only_the_expired_file_and_preserves_history(): void
    {
        [$business, $customer, $customerToken] = $this->tenant();
        $product = $this->product($business, 1000, 3);
        $order = $this->order($business, $customer, $product, 1, 'RETENTION-1');
        $paymentId = $this->withToken($customerToken)->post("/api/v1/customer/orders/{$order->getKey()}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'EXPIRING-1', 'proof' => UploadedFile::fake()->image('expiring.png'),
        ])->assertCreated()->json('id');
        $payment = RecordedPayment::query()->findOrFail($paymentId);
        $path = $payment->proof_path;
        $payment->update(['retained_until' => now()->subDay()]);

        $this->artisan('payment-proofs:purge')->assertSuccessful();

        Storage::disk('local')->assertMissing($path);
        $payment->refresh();
        $this->assertNull($payment->proof_path);
        $this->assertNotNull($payment->proof_deleted_at);
        $this->assertDatabaseHas('payment_review_events', ['recorded_payment_id' => $payment->getKey(), 'status' => 'SUBMITTED']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'payment.proof_purged', 'subject_id' => (string) $payment->getKey()]);
    }

    /** @return array{Business,User,string,string} */
    private function tenant(string $name = 'Payment Store', string $slug = 'payment-store'): array
    {
        $business = Business::query()->create(['name' => $name, 'slug' => $slug, 'status' => BusinessStatus::Active, 'approved_at' => now()]);
        PaymentInstruction::query()->create([
            'business_id' => $business->getKey(), 'method' => 'GCASH', 'account_name' => $name,
            'account_number' => '09171234567', 'is_active' => true,
        ]);
        PaymentInstruction::query()->create([
            'business_id' => $business->getKey(), 'method' => 'MAYA', 'account_name' => $name,
            'account_number' => '09181234567', 'is_active' => true,
        ]);
        $plan = SubscriptionPlan::query()->where('code', 'STANDARD')->firstOrFail();
        $business->subscription()->create([
            'subscription_plan_id' => $plan->getKey(), 'status' => SubscriptionStatus::Active,
            'starts_at' => now(), 'current_period_start' => now(), 'current_period_end' => now()->addMonth(),
        ]);
        $customer = User::factory()->create();
        $owner = User::factory()->create();
        Membership::query()->create(['business_id' => $business->getKey(), 'user_id' => $customer->getKey(), 'role' => Role::Customer]);
        Membership::query()->create(['business_id' => $business->getKey(), 'user_id' => $owner->getKey(), 'role' => Role::BusinessOwner]);
        $customerToken = $this->postJson('/api/v1/auth/login', ['email' => $customer->email, 'password' => 'password', 'businessId' => $business->getKey()])->assertOk()->json('accessToken');
        $ownerToken = $this->postJson('/api/v1/auth/login', ['email' => $owner->email, 'password' => 'password', 'businessId' => $business->getKey()])->assertOk()->json('accessToken');

        return [$business->fresh('subscription'), $customer, $customerToken, $ownerToken];
    }

    private function product(Business $business, int $priceMinor, int $quantity): Product
    {
        $category = Category::query()->create(['business_id' => $business->getKey(), 'name' => 'Payments '.(Category::query()->count() + 1)]);
        $product = Product::query()->create([
            'business_id' => $business->getKey(), 'category_id' => $category->getKey(), 'sku' => 'PAY-'.$business->getKey().'-'.(Product::query()->count() + 1),
            'name' => 'Payment Product', 'price_minor' => $priceMinor, 'is_active' => true,
        ]);
        InventoryStock::query()->create(['business_id' => $business->getKey(), 'product_id' => $product->getKey(), 'quantity' => $quantity]);

        return $product;
    }

    private function order(Business $business, User $customer, Product $product, int $quantity, string $key): Order
    {
        $total = $product->price_minor * $quantity;
        $order = Order::query()->create([
            'business_id' => $business->getKey(), 'customer_user_id' => $customer->getKey(), 'customer_name' => $customer->name,
            'customer_email' => $customer->email, 'order_number' => $key, 'status' => OrderStatus::Pending,
            'fulfillment_method' => 'PICKUP', 'subtotal_minor' => $total, 'total_minor' => $total,
            'idempotency_key' => $key, 'request_fingerprint' => hash('sha256', $key), 'placed_at' => now(),
        ]);
        $order->lines()->create([
            'business_id' => $business->getKey(), 'product_id' => $product->getKey(), 'sku' => $product->sku,
            'product_name' => $product->name, 'unit_price_minor' => $product->price_minor, 'quantity' => $quantity, 'line_total_minor' => $total,
        ]);
        $order->statusEvents()->create([
            'business_id' => $business->getKey(), 'actor_user_id' => $customer->getKey(), 'status' => OrderStatus::Pending, 'actor_name' => $customer->name,
        ]);

        return $order;
    }
}
