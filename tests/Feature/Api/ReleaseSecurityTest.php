<?php

namespace Tests\Feature\Api;

use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;
use Tests\TestCase;

class ReleaseSecurityTest extends TestCase
{
    public function test_api_responses_include_release_security_headers(): void
    {
        $this->getJson('/api/v1/health')
            ->assertHeader('Content-Security-Policy', "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
            ->assertHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=()')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY');
    }

    public function test_only_the_documented_api_routes_are_public(): void
    {
        $allowed = [
            'api/v1/auth/login' => ['POST'],
            'api/v1/auth/refresh' => ['POST'],
            'api/v1/business-registrations' => ['POST'],
            'api/v1/health' => ['GET', 'HEAD'],
            'api/v1/storefronts' => ['GET', 'HEAD'],
            'api/v1/storefronts/{slug}' => ['GET', 'HEAD'],
        ];

        foreach ($this->apiRoutes() as $route) {
            if (in_array('auth.access', $route->gatherMiddleware(), true)) {
                continue;
            }

            $this->assertArrayHasKey($route->uri(), $allowed, "Unexpected public API route: {$route->uri()}");
            $this->assertEmpty(
                array_diff($route->methods(), $allowed[$route->uri()]),
                "Unexpected public method on {$route->uri()}",
            );
        }
    }

    public function test_tenant_and_platform_route_guards_are_structural_invariants(): void
    {
        foreach ($this->apiRoutes() as $route) {
            $middleware = $route->gatherMiddleware();
            if (str_starts_with($route->uri(), 'api/v1/platform/')) {
                $this->assertContains('auth.access', $middleware, $route->uri());
                $this->assertContains('role:SUPER_ADMIN', $middleware, $route->uri());

                continue;
            }

            if ($this->isTenantOwnedRoute($route->uri())) {
                $this->assertContains('auth.access', $middleware, $route->uri());
                $this->assertContains('tenant', $middleware, $route->uri());
            }
        }
    }

    /** @return list<Route> */
    private function apiRoutes(): array
    {
        return array_values(array_filter(
            iterator_to_array(RouteFacade::getRoutes()),
            fn (Route $route): bool => str_starts_with($route->uri(), 'api/v1/'),
        ));
    }

    private function isTenantOwnedRoute(string $uri): bool
    {
        foreach ([
            'api/v1/ai/',
            'api/v1/categories',
            'api/v1/customer/',
            'api/v1/dashboard',
            'api/v1/events',
            'api/v1/inventory',
            'api/v1/notification',
            'api/v1/orders',
            'api/v1/payment-instructions',
            'api/v1/payments',
            'api/v1/pos/',
            'api/v1/products',
            'api/v1/reports/',
            'api/v1/tenant/',
            'api/v1/threads',
        ] as $prefix) {
            if (str_starts_with($uri, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
