<?php

namespace Tests\Feature\Api;

use App\Enums\Role;
use App\Models\BillingRecord;
use App\Models\Business;
use App\Models\RecordedPayment;
use App\Models\Subscription;
use App\Models\SubscriptionRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SubscriptionApplicationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ThrottleRequests::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_paid_initial_plan_stays_pending_until_receiving_wallet_payment_is_verified(): void
    {
        Storage::fake('local');
        $registration = $this->postJson('/api/v1/business-registrations', [
            'businessName' => 'New Standard Store', 'ownerName' => 'Nina Owner',
            'ownerEmail' => 'nina@example.test', 'password' => 'Registration123', 'planCode' => 'STANDARD',
        ])->assertCreated()->assertJsonPath('business.status', 'PENDING');
        $businessId = $registration->json('business.id');
        $requestId = $registration->json('application.id');
        $applicationToken = $registration->json('applicationToken');
        $this->assertSame(64, strlen($applicationToken));
        $this->assertDatabaseMissing('subscription_requests', ['application_token_hash' => $applicationToken]);

        $adminToken = $this->adminToken();
        $this->withToken($adminToken)->putJson('/api/v1/platform/wallets/GCASH', [
            'accountName' => 'OrderSync Platform', 'accountNumber' => '09990001111', 'isActive' => true,
        ])->assertOk();
        $this->withToken($adminToken)->postJson("/api/v1/platform/businesses/{$businessId}/approve")
            ->assertOk()->assertJsonPath('business.status', 'PENDING');
        $application = SubscriptionRequest::query()->findOrFail($requestId);
        $this->assertSame('AWAITING_PAYMENT', $application->status);
        $this->assertSame(19_900, $application->amount_due_minor);
        $this->assertSame('PENDING', Business::query()->findOrFail($businessId)->status->value);
        $this->postJson('/api/v1/auth/login', ['email' => 'nina@example.test', 'password' => 'Registration123'])
            ->assertForbidden();

        $this->withHeader('X-Application-Token', 'wrong')->getJson("/api/v1/business-registrations/{$requestId}/status")
            ->assertNotFound();
        $this->withHeader('X-Application-Token', $applicationToken)->getJson("/api/v1/business-registrations/{$requestId}/status")
            ->assertOk()->assertJsonPath('wallets.0.accountName', 'OrderSync Platform')
            ->assertJsonPath('application.amountDueMinor', 19_900);
        $this->withHeader('X-Application-Token', $applicationToken)->post("/api/v1/business-registrations/{$requestId}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'GC-INITIAL-001',
            'proof' => UploadedFile::fake()->image('receipt.jpg'),
        ])->assertCreated()->assertJsonPath('application.status', 'PAYMENT_SUBMITTED');
        $payment = RecordedPayment::query()->latest('id')->firstOrFail();
        $this->assertTrue(Storage::disk('local')->exists($payment->proof_path));
        $this->withToken($adminToken)->postJson("/api/v1/platform/payments/{$payment->getKey()}/review", [
            'decision' => 'VERIFIED',
        ])->assertStatus(422)->assertJsonPath('code', 'WALLET_RECEIPT_NOT_CONFIRMED');
        $this->assertSame('PENDING', Business::query()->findOrFail($businessId)->status->value);
        $this->withToken($adminToken)->postJson("/api/v1/platform/payments/{$payment->getKey()}/review", [
            'decision' => 'VERIFIED', 'walletReceiptConfirmed' => true,
        ])->assertOk();

        $this->assertSame('ACTIVE', Business::query()->findOrFail($businessId)->status->value);
        $this->assertSame('APPROVED', $application->refresh()->status);
        $this->assertSame('STANDARD', Business::query()->findOrFail($businessId)->subscription->plan->code);
        $this->assertSame('PAID', BillingRecord::query()->where('subscription_request_id', $requestId)->firstOrFail()->status->value);
        $this->postJson('/api/v1/auth/login', ['email' => 'nina@example.test', 'password' => 'Registration123'])
            ->assertOk();
    }

    public function test_rejected_application_never_requests_payment_or_activates_a_business(): void
    {
        $registration = $this->postJson('/api/v1/business-registrations', [
            'businessName' => 'Rejected Store', 'ownerName' => 'Rita Owner',
            'ownerEmail' => 'rita@example.test', 'password' => 'Registration123', 'planCode' => 'PREMIUM',
        ])->assertCreated();
        $requestId = $registration->json('application.id');
        $businessId = $registration->json('business.id');
        $this->withToken($this->adminToken())->postJson("/api/v1/platform/subscription-requests/{$requestId}/review", [
            'decision' => 'REJECT', 'reason' => 'Could not verify this business application.',
        ])->assertOk()->assertJsonPath('status', 'REJECTED');
        $this->assertSame('REJECTED', Business::query()->findOrFail($businessId)->status->value);
        $this->assertNull(Subscription::query()->where('business_id', $businessId)->first());
        $this->withHeader('X-Application-Token', $registration->json('applicationToken'))
            ->getJson("/api/v1/business-registrations/{$requestId}/status")
            ->assertOk()->assertJsonPath('application.rejectionReason', 'Could not verify this business application.')
            ->assertJsonPath('wallets', []);
    }

    public function test_mid_period_upgrade_charges_the_difference_and_keeps_the_renewal_date(): void
    {
        Storage::fake('local');
        $registration = $this->postJson('/api/v1/business-registrations', [
            'businessName' => 'Growing Store', 'ownerName' => 'Grace Owner',
            'ownerEmail' => 'grace@example.test', 'password' => 'Registration123', 'planCode' => 'BASIC',
        ])->assertCreated();
        $businessId = $registration->json('business.id');
        $adminToken = $this->adminToken();
        $this->withToken($adminToken)->putJson('/api/v1/platform/wallets/MAYA', [
            'accountName' => 'OrderSync Platform', 'accountNumber' => '09990002222', 'isActive' => true,
        ])->assertOk();
        $this->withToken($adminToken)->postJson("/api/v1/platform/businesses/{$businessId}/approve")
            ->assertOk()->assertJsonPath('business.status', 'ACTIVE');
        $subscription = Subscription::query()->where('business_id', $businessId)->firstOrFail();
        $oldEnd = $subscription->current_period_end->toIso8601String();
        Carbon::setTestNow(now()->addDays(15));
        $ownerToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'grace@example.test', 'password' => 'Registration123',
        ])->assertOk()->json('accessToken');
        $application = $this->withToken($ownerToken)->postJson('/api/v1/tenant/subscription-requests', [
            'planCode' => 'STANDARD',
        ])->assertCreated()->assertJsonPath('status', 'PENDING_REVIEW');
        $requestId = $application->json('id');
        $amount = $application->json('amountDueMinor');
        $this->assertGreaterThan(0, $amount);
        $this->assertLessThan(19_900, $amount);
        $this->assertSame($oldEnd, $application->json('periodEndSnapshot'));

        $adminToken = $this->adminToken();
        $this->withToken($adminToken)->postJson("/api/v1/platform/subscription-requests/{$requestId}/review", [
            'decision' => 'APPROVE',
        ])->assertOk()->assertJsonPath('status', 'AWAITING_PAYMENT');
        $bill = BillingRecord::query()->where('subscription_request_id', $requestId)->firstOrFail();
        $this->assertSame($amount, $bill->amount_minor);
        $this->assertSame('BASIC', $subscription->refresh()->plan->code);
        $this->withToken($ownerToken)->post("/api/v1/tenant/billing-records/{$bill->getKey()}/payments", [
            'method' => 'MAYA', 'referenceNumber' => 'MY-UPGRADE-001',
            'proof' => UploadedFile::fake()->image('upgrade.jpg'),
        ])->assertCreated();
        $paymentId = RecordedPayment::query()->latest('id')->firstOrFail()->getKey();
        Carbon::setTestNow(now()->addDays(8)); // A timely proof can still be verified after the quote's submission deadline.
        $adminToken = $this->adminToken();
        $this->withToken($adminToken)->postJson("/api/v1/platform/payments/{$paymentId}/review", [
            'decision' => 'VERIFIED', 'walletReceiptConfirmed' => true,
        ])->assertOk();

        $this->assertSame('STANDARD', $subscription->refresh()->plan->code);
        $this->assertSame($oldEnd, $subscription->current_period_end->toIso8601String());
        $this->assertSame('APPROVED', SubscriptionRequest::query()->findOrFail($requestId)->status);
        $this->assertDatabaseHas('subscription_events', ['event_type' => 'subscription.upgraded', 'business_id' => $businessId]);
    }

    public function test_owner_can_cancel_an_unpaid_upgrade_and_request_a_fresh_quote(): void
    {
        Storage::fake('local');
        $registration = $this->postJson('/api/v1/business-registrations', [
            'businessName' => 'Changing Store', 'ownerName' => 'Clara Owner',
            'ownerEmail' => 'clara@example.test', 'password' => 'Registration123', 'planCode' => 'BASIC',
        ])->assertCreated();
        $adminToken = $this->adminToken();
        $this->withToken($adminToken)->putJson('/api/v1/platform/wallets/GCASH', [
            'accountName' => 'OrderSync Platform', 'accountNumber' => '09990001111', 'isActive' => true,
        ])->assertOk();
        $this->withToken($adminToken)->postJson('/api/v1/platform/businesses/'.$registration->json('business.id').'/approve')->assertOk();
        $ownerToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'clara@example.test', 'password' => 'Registration123',
        ])->assertOk()->json('accessToken');
        $upgrade = $this->withToken($ownerToken)->postJson('/api/v1/tenant/subscription-requests', ['planCode' => 'STANDARD'])->assertCreated();
        $id = $upgrade->json('id');
        $this->withToken($adminToken)->postJson("/api/v1/platform/subscription-requests/{$id}/review", ['decision' => 'APPROVE'])->assertOk();
        $billId = BillingRecord::query()->where('subscription_request_id', $id)->firstOrFail()->getKey();
        $this->withToken($ownerToken)->post("/api/v1/tenant/billing-records/{$billId}/payments", [
            'method' => 'GCASH', 'referenceNumber' => 'GC-REJECTED-001',
            'proof' => UploadedFile::fake()->image('rejected.jpg'),
        ])->assertCreated();
        $paymentId = RecordedPayment::query()->latest('id')->firstOrFail()->getKey();
        $this->withToken($adminToken)->postJson("/api/v1/platform/payments/{$paymentId}/review", [
            'decision' => 'REJECTED', 'reason' => 'No matching transaction in receiving wallet.',
        ])->assertOk();
        $this->withToken($ownerToken)->postJson("/api/v1/tenant/subscription-requests/{$id}/cancel")
            ->assertOk()->assertJsonPath('status', 'CANCELLED');
        $this->assertSame('VOID', BillingRecord::query()->where('subscription_request_id', $id)->firstOrFail()->status->value);
        $this->withToken($ownerToken)->postJson('/api/v1/tenant/subscription-requests', ['planCode' => 'STANDARD'])->assertCreated();
    }

    private function adminToken(): string
    {
        $admin = User::factory()->create(['platform_role' => Role::SuperAdmin]);

        return $this->postJson('/api/v1/auth/login', ['email' => $admin->email, 'password' => 'password'])
            ->assertOk()->json('accessToken');
    }
}
