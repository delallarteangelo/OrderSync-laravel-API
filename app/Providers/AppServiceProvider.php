<?php

namespace App\Providers;

use App\Contracts\AiSupportProvider;
use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use App\Policies\BusinessPolicy;
use App\Policies\CategoryPolicy;
use App\Policies\ProductPolicy;
use App\Support\Ai\LocalGroundedAiProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AiSupportProvider::class, LocalGroundedAiProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Business::class, BusinessPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
    }
}
