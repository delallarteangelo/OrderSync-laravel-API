<?php

namespace App\Support\Ai;

use App\Contracts\AiSupportProvider;

class LocalGroundedAiProvider implements AiSupportProvider
{
    public function code(): string
    {
        return 'LOCAL_GROUNDED';
    }

    public function answer(AiSupportContext $context): AiProviderResult
    {
        if (! $context->hasGrounding()) {
            return new AiProviderResult(
                "I couldn't find a verified answer in this store's published information. I've asked a person from the store to continue this conversation.",
                [],
                true,
                'NO_GROUNDED_ANSWER',
            );
        }

        $sections = [];
        $tools = [];
        if ($context->order !== null) {
            $order = $context->order;
            $sections[] = "Your order {$order['code']} is {$order['status']}. Its recorded total is ₱".number_format($order['total'], 2)." and it was placed {$order['placedAt']}.";
            $tools[] = 'customer_order_status';
        }
        if ($context->products !== []) {
            $lines = array_map(fn (array $product): string => "{$product['name']}: ₱".number_format($product['price'], 2).", {$product['stock']} currently available", $context->products);
            $sections[] = 'Current store products: '.implode('; ', $lines).'.';
            $tools[] = 'tenant_product_stock';
        }
        if ($context->knowledge !== []) {
            foreach ($context->knowledge as $entry) {
                $sections[] = "{$entry['title']}: {$entry['content']}";
            }
            $tools[] = 'tenant_knowledge';
        }

        $sections[] = 'This answer uses only this store’s published and live OrderSync records.';

        return new AiProviderResult(implode("\n\n", $sections), array_values(array_unique($tools)));
    }
}
