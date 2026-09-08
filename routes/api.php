<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ContextController;
use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', HealthController::class)->name('api.health');

Route::prefix('/v1')->group(function (): void {
    Route::prefix('/auth')->group(function (): void {
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
        Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('throttle:30,1');

        Route::middleware('auth.access')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::get('/businesses', [AuthController::class, 'businesses']);
            Route::post('/switch-business', [AuthController::class, 'switchBusiness']);
            Route::post('/change-password', [AuthController::class, 'changePassword']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    Route::get('/tenant/context', [ContextController::class, 'tenant'])
        ->middleware(['auth.access', 'tenant']);
    Route::get('/platform/context', [ContextController::class, 'platform'])
        ->middleware(['auth.access', 'role:SUPER_ADMIN']);
});
