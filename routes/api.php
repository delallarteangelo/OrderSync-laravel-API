<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BusinessRegistrationController;
use App\Http\Controllers\Api\V1\ContextController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\PlatformBusinessController;
use App\Http\Controllers\Api\V1\PlatformDashboardController;
use App\Http\Controllers\Api\V1\PlatformPlanController;
use App\Http\Controllers\Api\V1\PlatformSubscriptionController;
use App\Http\Controllers\Api\V1\PlatformUserController;
use App\Http\Controllers\Api\V1\TenantSubscriptionController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', HealthController::class)->name('api.health');

Route::prefix('/v1')->group(function (): void {
    Route::post('/business-registrations', [BusinessRegistrationController::class, 'store'])->middleware('throttle:5,1');

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

    Route::middleware(['auth.access', 'role:SUPER_ADMIN'])->prefix('/platform')->group(function (): void {
        Route::get('/dashboard', PlatformDashboardController::class);
        Route::get('/businesses', [PlatformBusinessController::class, 'index']);
        Route::post('/businesses/{business}/approve', [PlatformBusinessController::class, 'approve']);
        Route::post('/businesses/{business}/suspend', [PlatformBusinessController::class, 'suspend']);
        Route::post('/businesses/{business}/reactivate', [PlatformBusinessController::class, 'reactivate']);
        Route::put('/businesses/{business}/subscription', [PlatformSubscriptionController::class, 'assign']);
        Route::get('/plans', [PlatformPlanController::class, 'index']);
        Route::patch('/plans/{plan}', [PlatformPlanController::class, 'update']);
        Route::post('/subscriptions/{subscription}/renew', [PlatformSubscriptionController::class, 'renew']);
        Route::post('/subscriptions/{subscription}/grace', [PlatformSubscriptionController::class, 'grace']);
        Route::post('/subscriptions/{subscription}/cancel', [PlatformSubscriptionController::class, 'cancel']);
        Route::get('/subscriptions/{subscription}/history', [PlatformSubscriptionController::class, 'history']);
        Route::get('/billing-records', [PlatformSubscriptionController::class, 'billingIndex']);
        Route::post('/subscriptions/{subscription}/billing-records', [PlatformSubscriptionController::class, 'createBilling']);
        Route::post('/billing-records/{billingRecord}/mark-paid', [PlatformSubscriptionController::class, 'markBillingPaid']);
        Route::get('/users', [PlatformUserController::class, 'index']);
        Route::patch('/users/{user}/status', [PlatformUserController::class, 'updateStatus']);
    });

    Route::get('/tenant/subscription', TenantSubscriptionController::class)
        ->middleware(['auth.access', 'tenant', 'role:BUSINESS_OWNER']);
});
