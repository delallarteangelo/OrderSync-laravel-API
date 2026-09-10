<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AiKnowledgeType;
use App\Http\Controllers\Controller;
use App\Models\AiKnowledgeEntry;
use App\Models\Business;
use App\Services\AiSupportPayload;
use App\Services\AiSupportService;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AiAdministrationController extends Controller
{
    public function __construct(
        private readonly AiSupportService $support,
        private readonly AuditLogger $audit,
    ) {}

    public function knowledge(Request $request): JsonResponse
    {
        $entries = AiKnowledgeEntry::query()->where('business_id', $this->business($request)->getKey())
            ->orderByDesc('is_active')->orderBy('type')->orderBy('title')->get();

        return response()->json(['items' => $entries->map(fn (AiKnowledgeEntry $entry): array => AiSupportPayload::knowledge($entry))->all()]);
    }

    public function published(Request $request): JsonResponse
    {
        $entries = AiKnowledgeEntry::query()->where('business_id', $this->business($request)->getKey())
            ->where('is_active', true)->where(fn ($query) => $query->whereNull('published_at')->orWhere('published_at', '<=', now()))
            ->orderBy('type')->orderBy('title')->get();

        return response()->json(['items' => $entries->map(fn (AiKnowledgeEntry $entry): array => AiSupportPayload::knowledge($entry))->all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateKnowledge($request);
        $entry = AiKnowledgeEntry::query()->create([
            'business_id' => $this->business($request)->getKey(),
            ...$this->knowledgeAttributes($validated),
            'created_by_user_id' => $request->user()->getKey(),
            'updated_by_user_id' => $request->user()->getKey(),
        ]);
        $this->audit->record('ai.knowledge.created', $request, $request->user(), $this->business($request), AiKnowledgeEntry::class, $entry->getKey(), [
            'type' => $entry->type->value,
            'content_characters' => mb_strlen($entry->content),
        ]);

        return response()->json(AiSupportPayload::knowledge($entry), 201);
    }

    public function update(Request $request, AiKnowledgeEntry $knowledge): JsonResponse
    {
        $this->assertTenant($request, $knowledge);
        $validated = $this->validateKnowledge($request);
        $knowledge->update([
            ...$this->knowledgeAttributes($validated),
            'updated_by_user_id' => $request->user()->getKey(),
        ]);
        $this->audit->record('ai.knowledge.updated', $request, $request->user(), $this->business($request), AiKnowledgeEntry::class, $knowledge->getKey(), [
            'type' => $knowledge->type->value,
            'content_characters' => mb_strlen($knowledge->content),
        ]);

        return response()->json(AiSupportPayload::knowledge($knowledge->refresh()));
    }

    public function deactivate(Request $request, AiKnowledgeEntry $knowledge): JsonResponse
    {
        $this->assertTenant($request, $knowledge);
        $knowledge->update(['is_active' => false, 'updated_by_user_id' => $request->user()->getKey()]);
        $this->audit->record('ai.knowledge.deactivated', $request, $request->user(), $this->business($request), AiKnowledgeEntry::class, $knowledge->getKey());

        return response()->json(AiSupportPayload::knowledge($knowledge->refresh()));
    }

    public function settings(Request $request): JsonResponse
    {
        return response()->json(AiSupportPayload::settings($this->support->settings($this->business($request))));
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'assistantEnabled' => ['required', 'boolean'],
            'dailyCustomerRequestLimit' => ['required', 'integer', 'between:1,100'],
            'monthlyBusinessRequestLimit' => ['required', 'integer', 'between:1,100000'],
            'maximumQuestionCharacters' => ['required', 'integer', 'between:100,4000'],
        ]);
        $settings = $this->support->settings($this->business($request));
        $settings->update([
            'assistant_enabled' => $validated['assistantEnabled'],
            'daily_customer_request_limit' => $validated['dailyCustomerRequestLimit'],
            'monthly_business_request_limit' => $validated['monthlyBusinessRequestLimit'],
            'maximum_question_characters' => $validated['maximumQuestionCharacters'],
            'updated_by_user_id' => $request->user()->getKey(),
        ]);
        $this->audit->record('ai.settings.updated', $request, $request->user(), $this->business($request), $settings::class, $settings->getKey(), [
            'assistant_enabled' => $settings->assistant_enabled,
            'daily_customer_request_limit' => $settings->daily_customer_request_limit,
            'monthly_business_request_limit' => $settings->monthly_business_request_limit,
            'maximum_question_characters' => $settings->maximum_question_characters,
        ]);

        return response()->json(AiSupportPayload::settings($settings->refresh()));
    }

    public function usage(Request $request): JsonResponse
    {
        return response()->json($this->support->usage($this->business($request)));
    }

    /** @return array<string, mixed> */
    private function validateKnowledge(Request $request): array
    {
        return $request->validate([
            'type' => ['required', Rule::enum(AiKnowledgeType::class)],
            'title' => ['required', 'string', 'max:200'],
            'question' => ['nullable', 'string', 'max:1000', 'required_if:type,FAQ'],
            'content' => ['required', 'string', 'max:8000'],
            'keywords' => ['sometimes', 'array', 'max:20'],
            'keywords.*' => ['string', 'max:50'],
            'isActive' => ['sometimes', 'boolean'],
            'publishedAt' => ['nullable', 'date'],
        ]);
    }

    /** @param array<string, mixed> $validated */
    private function knowledgeAttributes(array $validated): array
    {
        return [
            'type' => $validated['type'],
            'title' => trim($validated['title']),
            'question' => isset($validated['question']) ? trim($validated['question']) : null,
            'content' => trim($validated['content']),
            'keywords' => array_values(array_unique(array_map('trim', $validated['keywords'] ?? []))),
            'is_active' => $validated['isActive'] ?? true,
            'published_at' => $validated['publishedAt'] ?? now(),
        ];
    }

    private function assertTenant(Request $request, AiKnowledgeEntry $knowledge): void
    {
        abort_unless($knowledge->business_id === $this->business($request)->getKey(), 404);
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
