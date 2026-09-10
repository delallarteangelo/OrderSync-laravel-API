<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\AiSupportException;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\ConversationThread;
use App\Models\SupportHandoff;
use App\Services\AiSupportPayload;
use App\Services\AiSupportService;
use App\Services\MessagingPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiSupportController extends Controller
{
    public function __construct(private readonly AiSupportService $support) {}

    public function respond(Request $request, ConversationThread $thread): JsonResponse
    {
        $validated = $request->validate(['body' => ['required', 'string', 'max:4000']]);
        try {
            $result = $this->support->respond($this->business($request), $thread, $request->user(), $validated['body'], $request);
        } catch (AiSupportException $exception) {
            return response()->json(['code' => $exception->errorCode, 'message' => $exception->getMessage()], $exception->status);
        }

        return response()->json([
            'question' => MessagingPayload::message($result['question'], $request->user()),
            'response' => MessagingPayload::message($result['response'], $request->user()),
            'run' => AiSupportPayload::run($result['run']),
            'handoff' => $result['handoff'] ? AiSupportPayload::handoff($result['handoff']) : null,
        ], 201);
    }

    public function requestHandoff(Request $request, ConversationThread $thread): JsonResponse
    {
        $validated = $request->validate(['note' => ['nullable', 'string', 'max:1000']]);
        $handoff = $this->support->requestHandoff($this->business($request), $thread, $request->user(), $validated['note'] ?? null, $request);

        return response()->json(AiSupportPayload::handoff($handoff), 201);
    }

    public function handoffs(Request $request): JsonResponse
    {
        $items = SupportHandoff::query()->where('business_id', $this->business($request)->getKey())
            ->with(['thread', 'customer', 'resolver'])->orderByRaw("CASE WHEN status = 'OPEN' THEN 0 ELSE 1 END")
            ->latest('requested_at')->limit(100)->get();

        return response()->json(['items' => $items->map(fn (SupportHandoff $handoff): array => AiSupportPayload::handoff($handoff))->all()]);
    }

    public function resolve(Request $request, SupportHandoff $handoff): JsonResponse
    {
        return response()->json(AiSupportPayload::handoff(
            $this->support->resolveHandoff($this->business($request), $handoff, $request->user(), $request),
        ));
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
