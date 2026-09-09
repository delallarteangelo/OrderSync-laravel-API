<?php

return [
    'payment_proof_retention_days' => max(1, (int) env('PAYMENT_PROOF_RETENTION_DAYS', 365)),
];
