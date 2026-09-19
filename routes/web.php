<?php

use Illuminate\Support\Facades\Route;

Route::get('/{path?}', function () {
    $entryPoint = public_path('app/index.html');

    if (! is_file($entryPoint)) {
        return view('welcome');
    }

    return response()->file($entryPoint);
})->where('path', '^(?!api(?:/|$)|up$|storage(?:/|$)).*');
