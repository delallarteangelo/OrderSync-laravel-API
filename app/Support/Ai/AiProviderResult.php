<?php

namespace App\Support\Ai;

final readonly class AiProviderResult
{
    /** @param array<int, string> $toolsUsed */
    public function __construct(
        public string $answer,
        public array $toolsUsed,
        public bool $needsHandoff = false,
        public ?string $reasonCode = null,
        public int $estimatedCostMinor = 0,
        public ?string $model = null,
    ) {}
}
