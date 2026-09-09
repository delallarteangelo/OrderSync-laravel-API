<?php

use App\Enums\OrderStatus;
use App\Exceptions\OrderWorkflowException;
use App\Models\Order;
use App\Models\User;
use App\Services\CustomerOrderService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;

require dirname(__DIR__, 2).'/vendor/autoload.php';

$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$order = Order::query()->findOrFail((int) $argv[1]);
$actor = User::query()->findOrFail((int) $argv[2]);

try {
    $app->make(CustomerOrderService::class)->transition(
        $order,
        $actor,
        Request::create('/api/v1/orders/'.$order->getKey().'/transition', 'POST'),
        OrderStatus::Confirmed,
        null,
    );
    echo 'CONFIRMED';
} catch (OrderWorkflowException $exception) {
    echo $exception->errorCode;
}
