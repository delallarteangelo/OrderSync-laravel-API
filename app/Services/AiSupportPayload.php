<?php

namespace App\Services;

use App\Models\AiKnowledgeEntry;
use App\Models\AiSupportRun;
use App\Models\AiSupportSetting;
use App\Models\Business;
use App\Models\SupportHandoff;
use App\Support\Ai\AiSupportProviderSelector;

class AiSupportPayload
{
    public static function knowledge(AiKnowledgeEntry $entry): array
    {
        return [
            'id' => (string) $entry->getKey(),
            'type' => $entry->type->value,
            'title' => $entry->title,
            'question' => $entry->question,
            'content' => $entry->content,
            'keywords' => $entry->keywords ?? [],
            'isActive' => $entry->is_active,
            'publishedAt' => $entry->published_at?->toIso8601String(),
            'createdAt' => $entry->created_at->toIso8601String(),
            'updatedAt' => $entry->updated_at->toIso8601String(),
        ];
    }

    public static function settings(AiSupportSetting $settings, Business $business): array
    {
        $provider = app(AiSupportProviderSelector::class)->forBusiness($business);

        return [
            'assistantEnabled' => $settings->assistant_enabled,
            'dailyCustomerRequestLimit' => $settings->daily_customer_request_limit,
            'monthlyBusinessRequestLimit' => $settings->monthly_business_request_limit,
            'maximumQuestionCharacters' => $settings->maximum_question_characters,
            'provider' => $provider->code(),
            'externalProviderConfigured' => $provider->code() === 'GEMINI',
            'publicInformationOnly' => $provider->code() === 'GEMINI' && ! config('ai_support.gemini.paid_tier'),
        ];
    }

    public static function run(AiSupportRun $run): array
    {
        return [
            'id' => (string) $run->getKey(),
            'status' => $run->status->value,
            'provider' => $run->provider,
            'model' => $run->model,
            'toolsUsed' => $run->tools_used ?? [],
            'inputCharacters' => $run->input_characters,
            'outputCharacters' => $run->output_characters,
            'estimatedCostMinor' => $run->estimated_cost_minor,
            'latencyMs' => $run->latency_ms,
            'reasonCode' => $run->reason_code,
            'createdAt' => $run->created_at->toIso8601String(),
        ];
    }

    public static function handoff(SupportHandoff $handoff): array
    {
        $handoff->loadMissing(['thread', 'customer', 'resolver']);

        return [
            'id' => (string) $handoff->getKey(),
            'threadId' => (string) $handoff->conversation_thread_id,
            'customer' => [
                'id' => $handoff->customer_user_id === null ? null : (string) $handoff->customer_user_id,
                'name' => $handoff->customer?->name ?? $handoff->thread->customer_name,
            ],
            'status' => $handoff->status->value,
            'reasonCode' => $handoff->reason_code,
            'customerNote' => $handoff->customer_note,
            'requestedAt' => $handoff->requested_at->toIso8601String(),
            'resolvedAt' => $handoff->resolved_at?->toIso8601String(),
            'resolvedBy' => $handoff->resolver?->name,
        ];
    }
}
