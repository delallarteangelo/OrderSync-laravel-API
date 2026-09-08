<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Entitlement;
use App\Models\SubscriptionPlan;
use App\Services\AuditLogger;
use App\Services\SaasPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlatformPlanController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(): JsonResponse
    {
        $definitions = Entitlement::query()->orderBy('id')->get();
        $plans = SubscriptionPlan::query()->with('entitlements')->orderBy('id')->get();

        return response()->json([
            'plans' => $plans->map(fn (SubscriptionPlan $plan) => SaasPayload::plan($plan))->all(),
            'entitlementDefinitions' => $definitions->map(fn (Entitlement $entitlement): array => [
                'key' => $entitlement->key,
                'name' => $entitlement->name,
                'description' => $entitlement->description,
                'valueType' => $entitlement->value_type,
            ])->all(),
        ]);
    }

    public function update(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        $validated = $request->validate([
            'priceMinor' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'graceDays' => ['sometimes', 'integer', 'min:0', 'max:90'],
            'isActive' => ['sometimes', 'boolean'],
            'entitlements' => ['sometimes', 'array'],
        ]);
        if ($plan->code === 'BASIC' && array_key_exists('isActive', $validated) && ! $validated['isActive']) {
            throw ValidationException::withMessages(['isActive' => ['The Basic plan must remain active for newly approved businesses.']]);
        }

        $definitions = Entitlement::query()->get()->keyBy('key');
        $entitlementValues = [];
        foreach (($validated['entitlements'] ?? []) as $key => $value) {
            $definition = $definitions->get($key);
            if (! $definition) {
                throw ValidationException::withMessages(["entitlements.$key" => ['Unknown entitlement.']]);
            }
            $entitlementValues[$definition->getKey()] = ['value' => $this->normalizeValue($definition, $value)];
        }

        DB::transaction(function () use ($request, $plan, $validated, $entitlementValues): void {
            $updates = [];
            foreach (['priceMinor' => 'price_minor', 'graceDays' => 'grace_days', 'isActive' => 'is_active'] as $input => $column) {
                if (array_key_exists($input, $validated)) {
                    $updates[$column] = $validated[$input];
                }
            }
            if ($updates !== []) {
                $plan->update($updates);
            }
            if ($entitlementValues !== []) {
                $plan->entitlements()->syncWithoutDetaching($entitlementValues);
            }
            $this->audit->record('subscription_plan.updated', $request, $request->user(), null, SubscriptionPlan::class, $plan->getKey(), [
                'plan_code' => $plan->code,
                'entitlements_updated' => count($entitlementValues),
            ]);
        });

        return response()->json(['plan' => SaasPayload::plan($plan->fresh('entitlements'))]);
    }

    private function normalizeValue(Entitlement $definition, mixed $value): string
    {
        if ($definition->value_type === 'BOOLEAN' && is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        if ($definition->value_type === 'INTEGER' && is_int($value) && $value >= 0) {
            return (string) $value;
        }
        if ($definition->value_type === 'STRING' && is_string($value) && mb_strlen($value) <= 255) {
            return $value;
        }

        throw ValidationException::withMessages([
            "entitlements.{$definition->key}" => ["A valid {$definition->value_type} value is required."],
        ]);
    }
}
