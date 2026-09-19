<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BusinessStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Membership;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\SaasPayload;
use App\Services\SubscriptionRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class BusinessRegistrationController extends Controller
{
    public function __construct(private readonly AuditLogger $audit, private readonly SubscriptionRequestService $applications) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'businessName' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('businesses', 'slug')],
            'timezone' => ['nullable', 'timezone'],
            'ownerName' => ['required', 'string', 'max:255'],
            'ownerEmail' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', Password::min(12)->letters()->numbers()],
            'planCode' => ['nullable', Rule::in(['BASIC', 'STANDARD', 'PREMIUM'])],
        ]);
        $plan = SubscriptionPlan::query()->where('code', $validated['planCode'] ?? 'BASIC')->where('is_active', true)->firstOrFail();
        $normalizedEmail = mb_strtolower(trim($validated['ownerEmail']));
        if (User::query()->whereRaw('LOWER(email) = ?', [$normalizedEmail])->exists()) {
            throw ValidationException::withMessages(['ownerEmail' => ['An account already exists for this email address.']]);
        }

        [$business, $application, $applicationToken] = DB::transaction(function () use ($validated, $request, $normalizedEmail, $plan): array {
            $slug = $validated['slug'] ?? $this->uniqueSlug($validated['businessName']);
            $business = Business::query()->create([
                'name' => trim($validated['businessName']),
                'slug' => $slug,
                'timezone' => $validated['timezone'] ?? 'Asia/Manila',
                'status' => BusinessStatus::Pending,
                'submitted_at' => now(),
            ]);
            $owner = User::query()->create([
                'name' => trim($validated['ownerName']),
                'email' => $normalizedEmail,
                'password' => $validated['password'],
                'is_active' => true,
            ]);
            Membership::query()->create([
                'business_id' => $business->getKey(),
                'user_id' => $owner->getKey(),
                'role' => Role::BusinessOwner,
            ]);
            $this->audit->record('business.registration_submitted', $request, $owner, $business, Business::class, $business->getKey());
            [$application, $applicationToken] = $this->applications->initial($business, $owner, $plan);

            return [$business->load(['memberships.user']), $application, $applicationToken];
        });

        return response()->json([
            'business' => SaasPayload::business($business),
            'application' => ['id' => (string) $application->getKey(), 'status' => $application->status],
            'applicationToken' => $applicationToken,
        ], 201);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'business';
        $candidate = $base;
        $suffix = 2;
        while (Business::query()->where('slug', $candidate)->exists()) {
            $candidate = $base.'-'.$suffix++;
        }

        return $candidate;
    }
}
