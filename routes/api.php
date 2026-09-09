<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BusinessRegistrationController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ContextController;
use App\Http\Controllers\Api\V1\CustomerOrderController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PlatformBusinessController;
use App\Http\Controllers\Api\V1\PlatformDashboardController;
use App\Http\Controllers\Api\V1\PlatformPlanController;
use App\Http\Controllers\Api\V1\PlatformSubscriptionController;
use App\Http\Controllers\Api\V1\PlatformUserController;
use App\Http\Controllers\Api\V1\PosSaleController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProductImageController;
use App\Http\Controllers\Api\V1\StorefrontController;
use App\Http\Controllers\Api\V1\TenantSubscriptionController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', HealthController::class)->name('api.health');

Route::prefix('/v1')->group(function (): void {
    Route::get('/storefronts', [StorefrontController::class, 'index']);
    Route::get('/storefronts/{slug}', [StorefrontController::class, 'show']);
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

    Route::middleware(['auth.access', 'tenant', 'role:BUSINESS_OWNER,STAFF,CASHIER'])->group(function (): void {
        Route::middleware('entitlement:catalog_enabled')->group(function (): void {
            Route::get('/categories', [CategoryController::class, 'index']);
            Route::get('/products', [ProductController::class, 'index']);
            Route::get('/products/by-barcode/{code}', [ProductController::class, 'byBarcode']);
            Route::get('/products/{product}', [ProductController::class, 'show']);
        });

        Route::middleware('entitlement:inventory_enabled')->group(function (): void {
            Route::get('/inventory', [InventoryController::class, 'index']);
            Route::get('/inventory/low-stock', [InventoryController::class, 'lowStock']);
            Route::get('/inventory/movements', [InventoryController::class, 'movements']);
        });
    });

    Route::middleware(['auth.access', 'tenant', 'role:BUSINESS_OWNER,STAFF'])->group(function (): void {
        Route::middleware('entitlement:catalog_enabled')->group(function (): void {
            Route::post('/categories', [CategoryController::class, 'store']);
            Route::put('/categories/{category}', [CategoryController::class, 'update']);
            Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
            Route::post('/products', [ProductController::class, 'store']);
            Route::put('/products/{product}', [ProductController::class, 'update']);
            Route::post('/products/{product}/deactivate', [ProductController::class, 'deactivate']);
            Route::post('/products/{product}/reactivate', [ProductController::class, 'reactivate']);
            Route::post('/products/{product}/image', [ProductImageController::class, 'store']);
        });

        Route::middleware('entitlement:inventory_enabled')->group(function (): void {
            Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);
            Route::post('/inventory/restock', [InventoryController::class, 'restock']);
        });
    });

    Route::middleware(['auth.access', 'tenant', 'role:BUSINESS_OWNER,STAFF,CASHIER', 'entitlement:pos_enabled'])
        ->prefix('/pos')->group(function (): void {
            Route::get('/sales', [PosSaleController::class, 'index']);
            Route::post('/sales', [PosSaleController::class, 'store']);
            Route::get('/sales/{sale}', [PosSaleController::class, 'show']);
        });

    Route::middleware(['auth.access', 'tenant', 'role:CUSTOMER', 'entitlement:customer_ordering_enabled'])
        ->prefix('/customer')->group(function (): void {
            Route::get('/orders', [CustomerOrderController::class, 'index']);
            Route::post('/orders', [CustomerOrderController::class, 'store']);
            Route::get('/orders/{order}', [CustomerOrderController::class, 'show']);
            Route::post('/orders/{order}/cancel', [CustomerOrderController::class, 'cancel']);
        });

    Route::middleware(['auth.access', 'tenant', 'role:BUSINESS_OWNER,STAFF,CASHIER', 'entitlement:customer_ordering_enabled'])
        ->prefix('/orders')->group(function (): void {
            Route::get('/', [OrderController::class, 'index']);
            Route::get('/{order}', [OrderController::class, 'show']);
            Route::post('/{order}/transition', [OrderController::class, 'transition']);
        });
});
