<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CustomerProfileController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fullName' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);
        $user = $request->user();
        $email = mb_strtolower(trim($validated['email']));
        if (User::query()->whereRaw('LOWER(email) = ?', [$email])->whereKeyNot($user->getKey())->exists()) {
            throw ValidationException::withMessages(['email' => ['This email is already used by another OrderSync account.']]);
        }

        $user->update(['name' => trim($validated['fullName']), 'email' => $email]);
        $user->customerProfile()->updateOrCreate([], ['phone' => trim((string) ($validated['phone'] ?? ''))]);
        $this->audit->record('customer.profile_updated', $request, $user, $request->attributes->get('currentBusiness'), User::class, $user->getKey());

        return response()->json(['user' => $this->payload($request, $user->refresh())]);
    }

    public function avatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096', 'dimensions:min_width=64,min_height=64,max_width=4096,max_height=4096'],
        ]);
        $user = $request->user();
        $profile = $user->customerProfile()->firstOrCreate([]);
        $oldPath = $profile->avatar_path;
        $path = $validated['avatar']->store("user-avatars/{$user->getKey()}", 'public');
        $profile->update(['avatar_path' => $path]);
        if ($oldPath && $oldPath !== $path) {
            Storage::disk('public')->delete($oldPath);
        }
        $this->audit->record('user.avatar_updated', $request, $user, $request->attributes->get('currentBusiness'), User::class, $user->getKey());

        return response()->json(['user' => $this->payload($request, $user->refresh())]);
    }

    /** @return array<string, mixed> */
    private function payload(Request $request, User $user): array
    {
        $profile = $user->customerProfile;
        $membership = $request->attributes->get('currentMembership');

        return [
            'id' => (string) $user->getKey(),
            'email' => $user->email,
            'fullName' => $user->name,
            'phone' => $profile?->phone ?? '',
            'avatarUrl' => $profile?->avatar_path ? Storage::disk('public')->url($profile->avatar_path) : null,
            'role' => $membership->role->value,
            'business' => [
                'id' => (string) $membership->business->getKey(),
                'name' => $membership->business->name,
                'slug' => $membership->business->slug,
            ],
        ];
    }
}
