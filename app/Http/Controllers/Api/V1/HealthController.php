<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            DB::select('select 1');
        } catch (Throwable) {
            return response()->json([
                'status' => 'unavailable',
                'service' => 'ordersync-api',
                'checks' => ['database' => 'unavailable'],
            ], 503);
        }

        return response()->json([
            'status' => 'ok',
            'service' => 'ordersync-api',
            'checks' => ['database' => 'ok'],
        ]);
    }
}
