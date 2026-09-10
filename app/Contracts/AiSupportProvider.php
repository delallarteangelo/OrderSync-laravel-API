<?php

namespace App\Contracts;

use App\Support\Ai\AiProviderResult;
use App\Support\Ai\AiSupportContext;

interface AiSupportProvider
{
    public function code(): string;

    public function answer(AiSupportContext $context): AiProviderResult;
}
