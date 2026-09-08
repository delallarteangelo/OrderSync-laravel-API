<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Membership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContextController extends Controller
{
    public function tenant(Request $request): JsonResponse
    {
        $business = $request->attributes->get('currentBusiness');
        /** @var Membership $membership */
        $membership = $request->attributes->get('currentMembership');

        return response()->json([
            'business' => [
                'id' => (string) $business->getKey(),
                'name' => $business->name,
                'slug' => $business->slug,
                'timezone' => $business->timezone,
            ],
            'membership' => [
                'id' => (string) $membership->getKey(),
                'role' => $membership->role->value,
            ],
        ]);
    }

    public function platform(Request $request): JsonResponse
    {
        return response()->json([
            'userId' => (string) $request->user()->getKey(),
            'role' => Role::SuperAdmin->value,
            'scope' => 'platform',
        ]);
    }
}
