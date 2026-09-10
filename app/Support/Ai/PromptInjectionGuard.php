<?php

namespace App\Support\Ai;

class PromptInjectionGuard
{
    /** @var array<int, string> */
    private array $blockedPatterns = [
        '/ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|messages?|prompts?)/iu',
        '/(show|reveal|print|dump|repeat).{0,40}(system|developer)\s+(prompt|message|instructions?)/iu',
        '/(show|reveal|print|dump|steal).{0,40}(secret|password|token|api[ _-]?key)/iu',
        '/(bypass|override|disable).{0,40}(authorization|permission|policy|guard)/iu',
        '/(another|other).{0,30}(customer|business|tenant).{0,30}(order|data|record)/iu',
        '/\b(jailbreak|prompt[ _-]?injection)\b/iu',
    ];

    public function reason(string $question): ?string
    {
        foreach ($this->blockedPatterns as $pattern) {
            if (preg_match($pattern, $question) === 1) {
                return 'UNSAFE_INSTRUCTION';
            }
        }

        return null;
    }
}
