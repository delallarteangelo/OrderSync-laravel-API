# Recorded GCash and Maya Payments

Phase 7 records GCash and Maya payment claims for customer pickup orders and subscription billing. The MVP never contacts a wallet provider: every proof is manually reviewed, and every client labels the result accordingly.

## Payment instructions and private files

Business Owners manage one GCash and one Maya instruction per tenant. Account details, optional text, active state, and an optional QR image are stored per business. Customers see active instructions only. QR images and payment proofs use Laravel's private `local` disk, are returned only through authenticated tenant-scoped endpoints with `private, no-store` caching, and are never exposed through the public storage link.

QR images accept JPEG, PNG, or WebP up to 2 MB. Proofs accept JPEG, PNG, WebP, or PDF up to 5 MB. The server derives the payable amount from the order or billing record; the client cannot choose it.

## Lifecycle and duplicate signals

Payments move from `SUBMITTED` to exactly one terminal result: `VERIFIED` or `REJECTED`. Rejection requires a reason. A rejected proof may be replaced; an order or bill cannot have more than one submitted or verified payment. Review events are append-only.

Within a tenant and wallet method, case-insensitive reference reuse is flagged. Reuse of the same SHA-256 proof content within a tenant is also flagged. These are reviewer signals, not automatic fraud decisions, and do not cross tenant boundaries.

If an order has payment records, business confirmation is blocked until one is verified. Orders with no payment record remain eligible for pay-at-pickup. A verified subscription payment atomically marks its billing record Paid. Receipts are created only by manual verification and explicitly return `providerConfirmed: false` and `verification: MANUAL`.

## API contracts

All routes use `/api/v1` and require the role and tenant middleware shown by their audience.

| Audience | Routes | Purpose |
| --- | --- | --- |
| Customer | `GET /customer/payment-instructions`, `GET /customer/payment-instructions/{id}/qr` | Read active tenant wallet details and a private QR |
| Customer | `GET/POST /customer/orders/{order}/payments` | Read owned payment history or submit one owned Pending-order proof |
| Customer | `GET /customer/payments/{payment}/proof`, `GET /customer/payments/{payment}/receipt` | Read only an owned order's private proof or verified receipt |
| Business Owner / Staff | `GET /payments`, `POST /payments/{payment}/review` | Review the tenant's customer-order queue |
| Business Owner / Staff | `GET /payments/{payment}/proof`, `GET /payments/{payment}/receipt` | Read tenant-scoped proof and receipt records |
| Business Owner | `GET/POST /payment-instructions/{method}`, `GET /payment-instructions/{id}/qr` | Manage tenant instructions and private QR files |
| Business Owner | `GET /tenant/billing-records`, `POST /tenant/billing-records/{bill}/payments` | Read tenant bills and submit subscription proof |
| Business Owner | `GET /tenant/payments/{payment}/proof`, `GET /tenant/payments/{payment}/receipt` | Read the tenant subscription proof and receipt |
| Super Admin | `GET /platform/payments`, `POST /platform/payments/{payment}/review` | Review subscription-payment proofs across businesses |
| Super Admin | `GET /platform/payments/{payment}/proof`, `GET /platform/payments/{payment}/receipt` | Read subscription proof and receipt records |

## Retention and audit

`PAYMENT_PROOF_RETENTION_DAYS` defaults to 365. Run `php artisan payment-proofs:purge --dry-run` to count eligible proofs, then `php artisan payment-proofs:purge` to delete expired files. Purging nulls the private path and records the deletion time while preserving the payment, review history, receipt metadata, hash, duplicate flags, and audit trail.

Instruction changes, submissions, verification, rejection, subscription billing updates, and file purges are audited without copying proof contents, private paths, references, tokens, or credentials into audit metadata.

## Client behavior

The React storefront presents active instructions and private QR downloads, uploads proofs, displays pending/rejected/verified states, and exposes manual receipts. The business payment workspace displays proof and duplicate signals and permits manual verification or reasoned rejection. Business settings include subscription-bill proof submission; the platform payment workspace reviews those claims.

The Android order screen loads the same authenticated instructions and QR bytes, accepts compressed camera or gallery images, submits multipart proofs, refreshes server-owned payment state, and hides customer cancellation after verification.
