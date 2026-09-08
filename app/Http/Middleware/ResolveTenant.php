<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $business = $request->attributes->get('currentBusiness');
        $membership = $request->attributes->get('currentMembership');

        if (! $business || ! $membership) {
            return response()->json([
                'code' => 'TENANT_REQUIRED',
                'message' => 'An active business context is required.',
            ], 403);
        }

        $requestedBusinessId = $request->header('X-Business-Id');
        if ($requestedBusinessId !== null && (string) $business->getKey() !== trim($requestedBusinessId)) {
            return response()->json([
                'code' => 'TENANT_MISMATCH',
                'message' => 'The requested business does not match the authenticated context.',
            ], 403);
        }

        return $next($request);
    }
}
