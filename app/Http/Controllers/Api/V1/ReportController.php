<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Services\AnalyticsService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function __construct(private readonly AnalyticsService $analytics) {}

    public function dashboard(Request $request): JsonResponse
    {
        return response()->json($this->analytics->dashboard($this->business($request), $request->user()));
    }

    public function sales(Request $request): JsonResponse
    {
        [$bucket, $from, $to] = $this->range($request);

        return response()->json(['items' => $this->analytics->sales($this->business($request), $bucket, $from, $to), 'range' => $this->rangePayload($bucket, $from, $to)]);
    }

    public function orders(Request $request): JsonResponse
    {
        [$bucket, $from, $to] = $this->range($request);

        return response()->json(['items' => $this->analytics->orders($this->business($request), $bucket, $from, $to), 'range' => $this->rangePayload($bucket, $from, $to)]);
    }

    public function inventory(Request $request): JsonResponse
    {
        [, $from, $to] = $this->range($request, false);

        return response()->json(['items' => $this->analytics->inventory($this->business($request), $from, $to), 'range' => $this->rangePayload('day', $from, $to)]);
    }

    public function overview(Request $request): JsonResponse
    {
        [, $from, $to] = $this->range($request, false);

        return response()->json([...$this->analytics->overview($this->business($request), $from, $to), 'range' => $this->rangePayload('day', $from, $to)]);
    }

    /** @return array{string, CarbonImmutable, CarbonImmutable} */
    private function range(Request $request, bool $withBucket = true): array
    {
        $validated = $request->validate([
            'bucket' => [$withBucket ? 'sometimes' : 'nullable', Rule::in(['day', 'week', 'month'])],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);
        $bucket = $validated['bucket'] ?? 'day';
        $timezone = $this->business($request)->timezone;
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $defaultDays = match ($bucket) {
            'week' => 83, 'month' => 364, default => 29
        };
        $fromLocal = isset($validated['from']) ? CarbonImmutable::parse($validated['from'], $timezone)->startOfDay() : $today->subDays($defaultDays);
        $toLocal = isset($validated['to']) ? CarbonImmutable::parse($validated['to'], $timezone)->endOfDay() : $today->endOfDay();
        abort_if($fromLocal->diffInDays($toLocal) > 731, 422, 'Report ranges cannot exceed 732 days.');

        return [$bucket, $fromLocal->utc(), $toLocal->utc()];
    }

    /** @return array<string, string> */
    private function rangePayload(string $bucket, CarbonImmutable $from, CarbonImmutable $to): array
    {
        return ['bucket' => $bucket, 'from' => $from->toIso8601String(), 'to' => $to->toIso8601String(), 'timezone' => request()->attributes->get('currentBusiness')->timezone];
    }

    private function business(Request $request): Business
    {
        return $request->attributes->get('currentBusiness');
    }
}
