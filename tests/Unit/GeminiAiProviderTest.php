<?php

namespace Tests\Unit;

use App\Support\Ai\AiSupportContext;
use App\Support\Ai\GeminiAiProvider;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class GeminiAiProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('ai_support.gemini.api_key', 'test-only-placeholder');
        config()->set('ai_support.gemini.model', 'gemini-3.5-flash-lite');
        config()->set('ai_support.gemini.paid_tier', true);
    }

    public function test_it_sends_only_scoped_evidence_and_accepts_cited_facts(): void
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiResponse([
            'answer' => 'Your order ORD-20260915-OWN is READY FOR PICKUP. The total is ₱50.00.',
            'supported' => true,
            'evidenceIds' => ['O1'],
        ]), 200)]);

        $result = (new GeminiAiProvider)->answer($this->context());

        $this->assertSame('GEMINI', (new GeminiAiProvider)->code());
        $this->assertFalse($result->needsHandoff);
        $this->assertSame(['customer_order_status'], $result->toolsUsed);
        $this->assertSame('gemini-3.5-flash-lite', $result->model);
        Http::assertSent(function ($request): bool {
            $body = $request->data();
            $prompt = $body['contents'][0]['parts'][0]['text'];

            return $request->url() === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'
                && $request->hasHeader('x-goog-api-key', 'test-only-placeholder')
                && str_contains($prompt, 'ORD-20260915-OWN')
                && ! str_contains($prompt, 'FOREIGN')
                && ! array_key_exists('tools', $body);
        });
    }

    public function test_it_hands_off_fabricated_citations_prices_and_order_codes(): void
    {
        foreach ([
            ['answer' => 'Pickup is available.', 'supported' => true, 'evidenceIds' => ['FOREIGN']],
            ['answer' => 'Your order ORD-20260915-FOREIGN is ready.', 'supported' => true, 'evidenceIds' => ['O1']],
            ['answer' => 'Your total is ₱99.00.', 'supported' => true, 'evidenceIds' => ['O1']],
            ['answer' => 'I cannot verify this.', 'supported' => false, 'evidenceIds' => []],
        ] as $payload) {
            Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiResponse($payload), 200)]);
            $result = (new GeminiAiProvider)->answer($this->context());
            $this->assertTrue($result->needsHandoff);
            $this->assertStringNotContainsString('FOREIGN', $result->answer);
            $this->assertStringNotContainsString('₱99.00', $result->answer);
        }
    }

    public function test_it_never_calls_google_without_grounding_or_a_configured_key(): void
    {
        Http::fake();
        $result = (new GeminiAiProvider)->answer(new AiSupportContext('Unknown?', [], [], null));
        $this->assertTrue($result->needsHandoff);
        Http::assertNothingSent();

        config()->set('ai_support.gemini.api_key', null);
        $this->expectException(RuntimeException::class);
        (new GeminiAiProvider)->answer($this->context());
    }

    public function test_free_tier_never_sends_the_customer_question_or_private_order_facts(): void
    {
        config()->set('ai_support.gemini.paid_tier', false);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiResponse([
            'answer' => 'Rice Pack costs ₱125.00 and 7 are currently available.',
            'supported' => true,
            'evidenceIds' => ['P1'],
        ]), 200)]);

        $result = (new GeminiAiProvider)->answer(new AiSupportContext(
            'My private order ORD-20260915-OWN needs help. My email is person@example.com.',
            [],
            [['name' => 'Rice Pack', 'price' => 125.0, 'stock' => 7]],
            ['code' => 'ORD-20260915-OWN', 'status' => 'READY FOR PICKUP', 'total' => 50.0, 'placedAt' => 'Sep 15, 2026 9:00 AM'],
        ));

        $this->assertFalse($result->needsHandoff);
        Http::assertSent(function ($request): bool {
            $prompt = json_encode($request->data(), JSON_THROW_ON_ERROR);

            return str_contains($prompt, 'Rice Pack')
                && ! str_contains($prompt, 'person@example.com')
                && ! str_contains($prompt, 'ORD-20260915-OWN')
                && ! str_contains($prompt, 'READY FOR PICKUP')
                && ! str_contains($prompt, 'My private order');
        });
    }

    public function test_free_tier_hands_off_without_a_public_fact_even_when_an_order_exists(): void
    {
        config()->set('ai_support.gemini.paid_tier', false);
        Http::fake();

        $result = (new GeminiAiProvider)->answer($this->context());

        $this->assertTrue($result->needsHandoff);
        Http::assertNothingSent();
    }

    private function context(): AiSupportContext
    {
        return new AiSupportContext('Is my order ready?', [], [], [
            'code' => 'ORD-20260915-OWN',
            'status' => 'READY FOR PICKUP',
            'total' => 50.0,
            'placedAt' => 'Sep 15, 2026 9:00 AM',
        ]);
    }

    /** @param array<string, mixed> $answer */
    private function geminiResponse(array $answer): array
    {
        return [
            'candidates' => [['content' => ['parts' => [['text' => json_encode($answer, JSON_THROW_ON_ERROR)]]]]],
            'usageMetadata' => ['promptTokenCount' => 100, 'candidatesTokenCount' => 50],
        ];
    }
}
