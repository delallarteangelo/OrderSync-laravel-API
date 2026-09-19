<?php

namespace App\Services;

use App\Enums\AiSupportRunStatus;
use App\Enums\ConversationMessageKind;
use App\Enums\SupportHandoffStatus;
use App\Exceptions\AiSupportException;
use App\Models\AiKnowledgeEntry;
use App\Models\AiSupportRun;
use App\Models\AiSupportSetting;
use App\Models\Business;
use App\Models\ConversationMessage;
use App\Models\ConversationThread;
use App\Models\Order;
use App\Models\Product;
use App\Models\SupportHandoff;
use App\Models\User;
use App\Support\Ai\AiProviderResult;
use App\Support\Ai\AiSupportContext;
use App\Support\Ai\AiSupportProviderSelector;
use App\Support\Ai\PromptInjectionGuard;
use App\Support\Database\DatabaseDialect;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class AiSupportService
{
    public function __construct(
        private readonly AiSupportProviderSelector $providers,
        private readonly PromptInjectionGuard $guard,
        private readonly AuditLogger $audit,
        private readonly MessagingService $messaging,
    ) {}

    public function settings(Business $business): AiSupportSetting
    {
        return AiSupportSetting::query()->firstOrCreate(['business_id' => $business->getKey()]);
    }

    /** @return array{question:ConversationMessage,response:ConversationMessage,run:AiSupportRun,handoff:?SupportHandoff} */
    public function respond(Business $business, ConversationThread $thread, User $customer, string $question, Request $request): array
    {
        $settings = $this->settings($business);
        if (! $settings->assistant_enabled) {
            throw new AiSupportException('AI_SUPPORT_DISABLED', 'Automated support is disabled for this store.', 409);
        }
        $question = trim($question);
        if (mb_strlen($question) > $settings->maximum_question_characters) {
            throw new AiSupportException('QUESTION_TOO_LONG', "Questions cannot exceed {$settings->maximum_question_characters} characters.", 422);
        }
        $this->enforceUsageLimits($business, $customer, $settings, $request);

        $questionMessage = DB::transaction(function () use ($business, $thread, $customer, $question): ConversationMessage {
            $locked = ConversationThread::query()->lockForUpdate()->findOrFail($thread->getKey());
            $this->assertCustomerThread($business, $locked, $customer);
            $message = $locked->messages()->create([
                'business_id' => $business->getKey(),
                'sender_user_id' => $customer->getKey(),
                'sender_role' => 'CUSTOMER',
                'kind' => ConversationMessageKind::Human,
                'body' => $question,
                'sent_at' => now(),
            ]);
            $locked->update(['last_message_at' => $message->sent_at]);

            return $message;
        });

        $started = hrtime(true);
        $provider = $this->providers->forBusiness($business, $question);
        $reason = $this->guard->reason($question);
        if ($reason !== null) {
            $result = new AiProviderResult(
                "I can't follow instructions that request hidden prompts, credentials, or another account's information. I've asked a person from the store to help safely.",
                ['prompt_safety'],
                true,
                $reason,
            );
            $status = AiSupportRunStatus::Refused;
        } else {
            try {
                $result = $provider->answer($this->context($business, $thread, $customer, $question));
                $status = $result->needsHandoff ? AiSupportRunStatus::Handoff : AiSupportRunStatus::Answered;
            } catch (Throwable) {
                $result = new AiProviderResult(
                    "Automated support is temporarily unavailable. I've asked a person from the store to continue this conversation.",
                    [],
                    true,
                    'PROVIDER_UNAVAILABLE',
                );
                $status = AiSupportRunStatus::Unavailable;
            }
        }
        $latencyMs = max(0, (int) round((hrtime(true) - $started) / 1_000_000));

        $completed = DB::transaction(function () use ($business, $thread, $customer, $questionMessage, $result, $status, $latencyMs, $provider): array {
            $locked = ConversationThread::query()->lockForUpdate()->findOrFail($thread->getKey());
            $this->assertCustomerThread($business, $locked, $customer);
            $response = $locked->messages()->create([
                'business_id' => $business->getKey(),
                'sender_user_id' => null,
                'sender_role' => 'AI',
                'kind' => ConversationMessageKind::Ai,
                'body' => $result->answer,
                'sent_at' => now(),
            ]);
            $locked->update(['last_message_at' => $response->sent_at]);
            $run = AiSupportRun::query()->create([
                'business_id' => $business->getKey(),
                'conversation_thread_id' => $locked->getKey(),
                'customer_user_id' => $customer->getKey(),
                'question_message_id' => $questionMessage->getKey(),
                'response_message_id' => $response->getKey(),
                'status' => $status,
                'provider' => $provider->code(),
                'model' => $result->model,
                'tools_used' => $result->toolsUsed,
                'input_characters' => mb_strlen($questionMessage->body),
                'output_characters' => mb_strlen($result->answer),
                'estimated_cost_minor' => $result->estimatedCostMinor,
                'latency_ms' => $latencyMs,
                'reason_code' => $result->reasonCode,
                'created_at' => now(),
            ]);
            $handoff = $result->needsHandoff
                ? $this->openHandoff($locked, $customer, $result->reasonCode ?? 'ASSISTANT_HANDOFF', null, $run)
                : null;

            return compact('response', 'run', 'handoff');
        });

        if ($completed['handoff']) {
            $this->messaging->notifyBusinessSupport($thread, 'Customer requested support', 'Automated support handed this conversation to your team.');
        }
        $this->audit->record('ai.support.completed', $request, $customer, $business, AiSupportRun::class, $completed['run']->getKey(), [
            'thread_id' => $thread->getKey(),
            'status' => $status->value,
            'provider' => $provider->code(),
            'tools' => implode(',', $result->toolsUsed),
            'input_characters' => mb_strlen($question),
            'output_characters' => mb_strlen($result->answer),
            'estimated_cost_minor' => $result->estimatedCostMinor,
            'latency_ms' => $latencyMs,
            'reason_code' => $result->reasonCode,
        ]);

        return ['question' => $questionMessage, ...$completed];
    }

    public function requestHandoff(Business $business, ConversationThread $thread, User $customer, ?string $note, Request $request): SupportHandoff
    {
        $handoff = DB::transaction(function () use ($business, $thread, $customer, $note): SupportHandoff {
            $locked = ConversationThread::query()->lockForUpdate()->findOrFail($thread->getKey());
            $this->assertCustomerThread($business, $locked, $customer);
            $handoff = $this->openHandoff($locked, $customer, 'CUSTOMER_REQUEST', $note);
            $message = $locked->messages()->create([
                'business_id' => $business->getKey(),
                'sender_user_id' => null,
                'sender_role' => 'SYSTEM',
                'kind' => ConversationMessageKind::System,
                'body' => 'Human support was requested. A store team member can continue in this conversation.',
                'sent_at' => now(),
            ]);
            $locked->update(['last_message_at' => $message->sent_at]);

            return $handoff;
        });
        $this->messaging->notifyBusinessSupport($thread, 'Customer requested human support', $note ?: 'Open the conversation to respond.');
        $this->audit->record('ai.handoff.requested', $request, $customer, $business, SupportHandoff::class, $handoff->getKey(), [
            'thread_id' => $thread->getKey(),
            'reason_code' => 'CUSTOMER_REQUEST',
            'note_characters' => mb_strlen((string) $note),
        ]);

        return $handoff;
    }

    public function resolveHandoff(Business $business, SupportHandoff $handoff, User $resolver, Request $request): SupportHandoff
    {
        if ($handoff->business_id !== $business->getKey()) {
            abort(404);
        }
        $resolved = DB::transaction(function () use ($handoff, $resolver): SupportHandoff {
            $thread = ConversationThread::query()->lockForUpdate()->findOrFail($handoff->conversation_thread_id);
            $locked = SupportHandoff::query()->lockForUpdate()->findOrFail($handoff->getKey());
            if ($locked->status === SupportHandoffStatus::Resolved) {
                return $locked;
            }
            $updates = [
                'status' => SupportHandoffStatus::Resolved,
                'resolved_at' => now(),
                'resolved_by_user_id' => $resolver->getKey(),
            ];
            if (DatabaseDialect::isMySqlFamily()) {
                $updates['open_thread_id'] = null;
            }
            $locked->update($updates);
            $message = $thread->messages()->create([
                'business_id' => $thread->business_id,
                'sender_user_id' => null,
                'sender_role' => 'SYSTEM',
                'kind' => ConversationMessageKind::System,
                'body' => 'The human-support handoff was marked resolved by the store team.',
                'sent_at' => now(),
            ]);
            $thread->update(['last_message_at' => $message->sent_at]);

            return $locked->refresh();
        });
        $this->messaging->notifyCustomer($resolved->thread, 'Support handoff resolved', 'The store team marked your support handoff resolved. You can continue this conversation if needed.');
        $this->audit->record('ai.handoff.resolved', $request, $resolver, $business, SupportHandoff::class, $resolved->getKey(), [
            'thread_id' => $resolved->conversation_thread_id,
        ]);

        return $resolved;
    }

    /** @return array<string, mixed> */
    public function usage(Business $business): array
    {
        $timezone = $business->timezone;
        $start = CarbonImmutable::now($timezone)->startOfMonth()->utc();
        $query = AiSupportRun::query()->where('business_id', $business->getKey())->where('created_at', '>=', $start);
        $byStatus = (clone $query)->selectRaw('status, COUNT(*) AS aggregate')->groupBy('status')->pluck('aggregate', 'status');

        return [
            'period' => $start->setTimezone($timezone)->format('Y-m'),
            'provider' => $this->providers->forBusiness($business)->code(),
            'externalProviderConfigured' => $this->providers->forBusiness($business)->code() === 'GEMINI',
            'publicInformationOnly' => $this->providers->forBusiness($business)->code() === 'GEMINI' && ! config('ai_support.gemini.paid_tier'),
            'requests' => (clone $query)->count(),
            'answered' => (int) ($byStatus[AiSupportRunStatus::Answered->value] ?? 0),
            'handedOff' => (int) (($byStatus[AiSupportRunStatus::Handoff->value] ?? 0) + ($byStatus[AiSupportRunStatus::Refused->value] ?? 0) + ($byStatus[AiSupportRunStatus::Unavailable->value] ?? 0)),
            'inputCharacters' => (int) (clone $query)->sum('input_characters'),
            'outputCharacters' => (int) (clone $query)->sum('output_characters'),
            'estimatedCostMinor' => (int) (clone $query)->sum('estimated_cost_minor'),
            'averageLatencyMs' => (int) round((float) ((clone $query)->avg('latency_ms') ?? 0)),
        ];
    }

    private function enforceUsageLimits(Business $business, User $customer, AiSupportSetting $settings, Request $request): void
    {
        $now = CarbonImmutable::now($business->timezone);
        $dayCount = AiSupportRun::query()->where('business_id', $business->getKey())->where('customer_user_id', $customer->getKey())
            ->where('created_at', '>=', $now->startOfDay()->utc())->count();
        $monthCount = AiSupportRun::query()->where('business_id', $business->getKey())
            ->where('created_at', '>=', $now->startOfMonth()->utc())->count();
        if ($dayCount >= $settings->daily_customer_request_limit || $monthCount >= $settings->monthly_business_request_limit) {
            $reason = $dayCount >= $settings->daily_customer_request_limit ? 'DAILY_CUSTOMER_LIMIT' : 'MONTHLY_BUSINESS_LIMIT';
            $this->audit->record('ai.support.limit_rejected', $request, $customer, $business, null, null, ['reason_code' => $reason]);
            throw new AiSupportException('AI_USAGE_LIMIT_REACHED', 'Automated support usage has reached its configured limit. You can request human support.', 429);
        }
    }

    private function context(Business $business, ConversationThread $thread, User $customer, string $question): AiSupportContext
    {
        return new AiSupportContext(
            $question,
            $this->knowledgeContext($business, $question),
            $this->productContext($business, $question),
            $this->orderContext($business, $thread, $customer, $question),
        );
    }

    /** @return array<int, array{title:string,content:string,type:string}> */
    private function knowledgeContext(Business $business, string $question): array
    {
        $tokens = $this->tokens($question);
        $generic = preg_match('/\b(faq|hours?|open|announcement|promo|policy|pickup|payment)\b/iu', $question) === 1;

        return AiKnowledgeEntry::query()->where('business_id', $business->getKey())->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('published_at')->orWhere('published_at', '<=', now()))
            ->latest('published_at')->limit(100)->get()
            ->map(function (AiKnowledgeEntry $entry) use ($tokens, $generic): array {
                $haystack = mb_strtolower(implode(' ', [$entry->title, (string) $entry->question, $entry->content, implode(' ', $entry->keywords ?? [])]));
                $score = collect($tokens)->filter(fn (string $token): bool => str_contains($haystack, $token))->count();

                return ['entry' => $entry, 'score' => $score + ($generic ? 1 : 0)];
            })->filter(fn (array $row): bool => $row['score'] > 0)->sortByDesc('score')->take(3)->values()
            ->map(fn (array $row): array => ['title' => $row['entry']->title, 'content' => $row['entry']->content, 'type' => $row['entry']->type->value])->all();
    }

    /** @return array<int, array{name:string,price:float,stock:int}> */
    private function productContext(Business $business, string $question): array
    {
        if (preg_match('/\b(product|stock|available|availability|price|buy|have)\b/iu', $question) !== 1) {
            return [];
        }
        $tokens = $this->tokens($question);
        $products = Product::query()->where('business_id', $business->getKey())->where('is_active', true)
            ->with('stock')->orderBy('name')->limit(200)->get();
        $matched = $products->filter(function (Product $product) use ($tokens): bool {
            $haystack = mb_strtolower("{$product->name} {$product->sku}");

            return collect($tokens)->contains(fn (string $token): bool => str_contains($haystack, $token));
        });
        if ($matched->isEmpty()) {
            $matched = $products;
        }

        return $matched->take(5)->map(fn (Product $product): array => [
            'name' => $product->name,
            'price' => $product->price_minor / 100,
            'stock' => $product->stock?->quantity ?? 0,
        ])->values()->all();
    }

    /** @return array{code:string,status:string,total:float,placedAt:string}|null */
    private function orderContext(Business $business, ConversationThread $thread, User $customer, string $question): ?array
    {
        if (preg_match('/\b(order|status|ready|payment)\b/iu', $question) !== 1) {
            return null;
        }
        preg_match('/\bORD-\d{8}-[A-Z0-9]+\b/iu', $question, $matches);
        $explicitCode = $matches[0] ?? null;
        $query = Order::query()->where('business_id', $business->getKey())->where('customer_user_id', $customer->getKey());
        if ($explicitCode !== null) {
            $order = $query->whereRaw('UPPER(order_number) = ?', [mb_strtoupper($explicitCode)])->first();
        } elseif ($thread->order_id !== null) {
            $order = $query->whereKey($thread->order_id)->first();
        } else {
            $order = $query->latest('placed_at')->first();
        }
        if (! $order) {
            return null;
        }

        return [
            'code' => $order->order_number,
            'status' => str_replace('_', ' ', $order->status->value),
            'total' => $order->total_minor / 100,
            'placedAt' => $order->placed_at->setTimezone($business->timezone)->format('M j, Y g:i A'),
        ];
    }

    /** @return array<int, string> */
    private function tokens(string $question): array
    {
        $ignored = ['about', 'available', 'could', 'have', 'please', 'store', 'their', 'there', 'these', 'this', 'what', 'when', 'where', 'which', 'with', 'would', 'your'];
        $tokens = preg_split('/[^\pL\pN]+/u', mb_strtolower($question), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return array_values(array_unique(array_filter($tokens, fn (string $token): bool => mb_strlen($token) >= 3 && ! in_array($token, $ignored, true))));
    }

    private function assertCustomerThread(Business $business, ConversationThread $thread, User $customer): void
    {
        abort_unless($thread->business_id === $business->getKey() && $thread->customer_user_id === $customer->getKey(), 404);
    }

    private function openHandoff(ConversationThread $thread, User $customer, string $reason, ?string $note = null, ?AiSupportRun $run = null): SupportHandoff
    {
        $attributes = [
            'business_id' => $thread->business_id,
            'customer_user_id' => $customer->getKey(),
            'ai_support_run_id' => $run?->getKey(),
            'reason_code' => $reason,
            'customer_note' => $note,
            'requested_at' => now(),
        ];
        if (DatabaseDialect::isMySqlFamily()) {
            $attributes['open_thread_id'] = $thread->getKey();
        }

        return SupportHandoff::query()->firstOrCreate(
            ['conversation_thread_id' => $thread->getKey(), 'status' => SupportHandoffStatus::Open->value],
            $attributes,
        );
    }
}
