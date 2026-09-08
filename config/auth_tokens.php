<?php

return [
    'access_token_minutes' => (int) env('AUTH_ACCESS_TOKEN_MINUTES', 15),
    'refresh_token_minutes' => (int) env('AUTH_REFRESH_TOKEN_MINUTES', 43200),
    'refresh_cookie' => env('AUTH_REFRESH_COOKIE', 'ordersync_refresh'),
    'refresh_cookie_path' => '/api/v1/auth',
    'refresh_cookie_secure' => (bool) env('AUTH_REFRESH_COOKIE_SECURE', false),
    'refresh_cookie_same_site' => env('AUTH_REFRESH_COOKIE_SAME_SITE', 'lax'),
];
