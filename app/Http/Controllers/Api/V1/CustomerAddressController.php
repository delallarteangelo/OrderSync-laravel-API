<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use App\Services\AuditLogger;
use App\Support\Database\DatabaseDialect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerAddressController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->customerAddresses()->orderByDesc('is_default')->orderBy('created_at')->get();

        return response()->json(['items' => $addresses->map(fn (CustomerAddress $address): array => $this->payload($address))->all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);
        $user = $request->user();
        if ($user->customerAddresses()->count() >= 10) {
            throw ValidationException::withMessages(['address' => ['You can save up to 10 addresses.']]);
        }
        $address = DB::transaction(function () use ($user, $validated): CustomerAddress {
            $makeDefault = (bool) ($validated['isDefault'] ?? false) || ! $user->customerAddresses()->exists();
            if ($makeDefault) {
                $user->customerAddresses()->update($this->defaultState(false, $user->getKey()));
            }

            return $user->customerAddresses()->create($this->attributes($validated, $makeDefault, $user->getKey()));
        });
        $this->audit->record('customer.address_created', $request, $user, $request->attributes->get('currentBusiness'), CustomerAddress::class, $address->getKey());

        return response()->json($this->payload($address), 201);
    }

    public function update(Request $request, CustomerAddress $address): JsonResponse
    {
        $this->ensureOwned($request, $address);
        $validated = $this->validated($request);
        DB::transaction(function () use ($request, $address, $validated): void {
            $makeDefault = (bool) ($validated['isDefault'] ?? false);
            if ($makeDefault) {
                $request->user()->customerAddresses()->whereKeyNot($address->getKey())
                    ->update($this->defaultState(false, $request->user()->getKey()));
            }
            $address->update($this->attributes($validated, $makeDefault || $address->is_default, $request->user()->getKey()));
        });
        $this->audit->record('customer.address_updated', $request, $request->user(), $request->attributes->get('currentBusiness'), CustomerAddress::class, $address->getKey());

        return response()->json($this->payload($address->refresh()));
    }

    public function destroy(Request $request, CustomerAddress $address): JsonResponse
    {
        $this->ensureOwned($request, $address);
        DB::transaction(function () use ($request, $address): void {
            $wasDefault = $address->is_default;
            $address->delete();
            if ($wasDefault) {
                $next = $request->user()->customerAddresses()->oldest()->first();
                $next?->update($this->defaultState(true, $request->user()->getKey()));
            }
        });
        $this->audit->record('customer.address_deleted', $request, $request->user(), $request->attributes->get('currentBusiness'), CustomerAddress::class, $address->getKey());

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:50'],
            'line1' => ['required', 'string', 'max:255'],
            'line2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:150'],
            'isDefault' => ['sometimes', 'boolean'],
        ]);
    }

    /** @param array<string, mixed> $validated @return array<string, mixed> */
    private function attributes(array $validated, bool $isDefault, int $userId): array
    {
        return [
            'label' => trim($validated['label']),
            'line1' => trim($validated['line1']),
            'line2' => trim((string) ($validated['line2'] ?? '')),
            'city' => trim($validated['city']),
            ...$this->defaultState($isDefault, $userId),
        ];
    }

    /** @return array<string, bool|int|null> */
    private function defaultState(bool $isDefault, int $userId): array
    {
        return [
            'is_default' => $isDefault,
            ...(DatabaseDialect::isMySqlFamily()
                ? ['default_user_id' => $isDefault ? $userId : null]
                : []),
        ];
    }

    /** @return array<string, mixed> */
    private function payload(CustomerAddress $address): array
    {
        return [
            'id' => (string) $address->getKey(),
            'label' => $address->label,
            'line1' => $address->line1,
            'line2' => $address->line2,
            'city' => $address->city,
            'isDefault' => $address->is_default,
        ];
    }

    private function ensureOwned(Request $request, CustomerAddress $address): void
    {
        abort_unless($address->user_id === $request->user()->getKey(), 404);
    }
}
