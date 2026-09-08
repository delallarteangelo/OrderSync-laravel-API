<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $role = $request->attributes->get('currentRole');
        $roleValue = $role instanceof Role ? $role->value : null;

        if (! $roleValue || ! in_array($roleValue, $roles, true)) {
            return response()->json([
                'code' => 'FORBIDDEN',
                'message' => 'You do not have permission to perform this action.',
            ], 403);
        }

        return $next($request);
    }
}
