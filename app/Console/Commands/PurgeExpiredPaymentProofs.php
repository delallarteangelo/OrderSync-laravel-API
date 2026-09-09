<?php

namespace App\Console\Commands;

use App\Models\RecordedPayment;
use App\Services\AuditLogger;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PurgeExpiredPaymentProofs extends Command
{
    protected $signature = 'payment-proofs:purge {--dry-run}';

    protected $description = 'Delete expired private payment-proof files while preserving review metadata';

    public function handle(AuditLogger $audit): int
    {
        $query = RecordedPayment::query()->whereNull('proof_deleted_at')->whereNotNull('proof_path')->where('retained_until', '<=', now());
        $count = 0;
        $query->orderBy('id')->chunkById(100, function ($payments) use (&$count, $audit): void {
            foreach ($payments as $payment) {
                $count++;
                if ($this->option('dry-run')) {
                    continue;
                }
                if (Storage::disk($payment->proof_disk)->delete($payment->proof_path)) {
                    $payment->update(['proof_path' => null, 'proof_deleted_at' => now()]);
                    $audit->record('payment.proof_purged', Request::create('/console/payment-proofs/purge', 'POST'), null, $payment->business, RecordedPayment::class, $payment->getKey(), [
                        'retained_until' => $payment->retained_until->toIso8601String(),
                    ]);
                }
            }
        });
        $this->info($this->option('dry-run') ? "{$count} proof(s) eligible." : "{$count} proof(s) processed.");

        return self::SUCCESS;
    }
}
