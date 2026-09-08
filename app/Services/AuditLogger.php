<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogger
{
    /**
     * @param  array<string, bool|int|float|string|null>  $metadata
     */
    public function record(
        string $action,
        Request $request,
        ?User $actor = null,
        ?Business $business = null,
        ?string $subjectType = null,
        int|string|null $subjectId = null,
        array $metadata = [],
    ): AuditLog {
        return AuditLog::create([
            'business_id' => $business?->getKey(),
            'actor_user_id' => $actor?->getKey(),
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId === null ? null : (string) $subjectId,
            'metadata' => $metadata === [] ? null : $metadata,
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 512) ?: null,
        ]);
    }
}
