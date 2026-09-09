<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PaymentMethod;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\PaymentInstruction;
use App\Services\AuditLogger;
use App\Services\RecordedPaymentPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class PaymentInstructionController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): JsonResponse
    {
        $instructions = $this->business($request)->paymentInstructions()->orderBy('method')->get();

        return response()->json(['items' => $instructions->map(fn (PaymentInstruction $instruction): array => RecordedPaymentPayload::instruction($instruction))->all()]);
    }

    public function customerIndex(Request $request): JsonResponse
    {
        $instructions = $this->business($request)->paymentInstructions()->where('is_active', true)->orderBy('method')->get();

        return response()->json([
            'verification' => 'MANUAL',
            'providerConfirmed' => false,
            'items' => $instructions->map(fn (PaymentInstruction $instruction): array => RecordedPaymentPayload::instruction($instruction))->all(),
        ]);
    }

    public function store(Request $request, string $method): JsonResponse
    {
        $business = $this->business($request);
        $method = PaymentMethod::tryFrom(mb_strtoupper($method));
        abort_unless(in_array($method, [PaymentMethod::GCash, PaymentMethod::Maya], true), 404);
        $validated = $request->validate([
            'accountName' => ['required', 'string', 'max:255'],
            'accountNumber' => ['required', 'string', 'max:120'],
            'instructions' => ['nullable', 'string', 'max:2000'],
            'active' => ['required', 'boolean'],
            'qr' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ]);
        $file = $request->file('qr');
        $newPath = null;
        if ($file) {
            $newPath = $file->storeAs("payment-instructions/{$business->getKey()}", Str::uuid().'.'.$file->extension(), 'local');
            if (! is_string($newPath)) {
                throw new RuntimeException('The QR image could not be stored.');
            }
        }

        $oldPath = null;
        try {
            $instruction = DB::transaction(function () use ($request, $business, $method, $validated, $file, $newPath, &$oldPath): PaymentInstruction {
                $instruction = PaymentInstruction::query()->where('business_id', $business->getKey())
                    ->where('method', $method->value)->lockForUpdate()->first();
                $oldPath = $file ? $instruction?->qr_path : null;
                $values = [
                    'account_name' => trim($validated['accountName']),
                    'account_number' => trim($validated['accountNumber']),
                    'instructions' => isset($validated['instructions']) ? trim($validated['instructions']) ?: null : null,
                    'is_active' => $validated['active'],
                ];
                if ($file) {
                    $values = [...$values, 'qr_disk' => 'local', 'qr_path' => $newPath, 'qr_mime_type' => $file->getMimeType(), 'qr_size_bytes' => $file->getSize()];
                }
                $instruction = PaymentInstruction::query()->updateOrCreate(
                    ['business_id' => $business->getKey(), 'method' => $method->value],
                    $values,
                );
                $this->audit->record('payment.instructions_updated', $request, $request->user(), $business, PaymentInstruction::class, $instruction->getKey(), [
                    'method' => $method->value,
                    'active' => (bool) $instruction->is_active,
                    'qr_updated' => $file !== null,
                ]);

                return $instruction;
            });
        } catch (Throwable $exception) {
            if ($newPath) {
                Storage::disk('local')->delete($newPath);
            }
            throw $exception;
        }
        if ($oldPath) {
            Storage::disk('local')->delete($oldPath);
        }

        return response()->json(RecordedPaymentPayload::instruction($instruction));
    }

    public function qr(Request $request, PaymentInstruction $instruction): StreamedResponse
    {
        abort_unless($instruction->business_id === $this->business($request)->getKey(), 404);
        $membership = $request->attributes->get('currentMembership');
        abort_unless($membership->role !== Role::Customer || $instruction->is_active, 404);
        abort_unless($instruction->qr_path && Storage::disk($instruction->qr_disk)->exists($instruction->qr_path), 404);

        return Storage::disk($instruction->qr_disk)->download(
            $instruction->qr_path,
            "{$instruction->method->value}-QR",
            ['Content-Type' => $instruction->qr_mime_type, 'Cache-Control' => 'private, no-store'],
        );
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
