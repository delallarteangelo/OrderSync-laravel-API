<?php

return [
    'provider' => env('AI_SUPPORT_PROVIDER', 'local'),
    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-3.5-flash-lite'),
        'timeout_seconds' => (int) env('GEMINI_TIMEOUT_SECONDS', 12),
        'paid_tier' => (bool) env('GEMINI_PAID_TIER', false),
        // Estimates only; the Google invoice and current exchange rate remain authoritative.
        'estimated_php_per_usd' => (float) env('GEMINI_ESTIMATED_PHP_PER_USD', 60),
    ],
];
