<?php

namespace App\Support\Ai;

final readonly class AiSupportContext
{
    /**
     * @param  array<int, array{title:string,content:string,type:string}>  $knowledge
     * @param  array<int, array{name:string,price:float,stock:int}>  $products
     * @param  array{code:string,status:string,total:float,placedAt:string}|null  $order
     */
    public function __construct(
        public string $question,
        public array $knowledge,
        public array $products,
        public ?array $order,
    ) {}

    public function hasGrounding(): bool
    {
        return $this->knowledge !== [] || $this->products !== [] || $this->order !== null;
    }
}
