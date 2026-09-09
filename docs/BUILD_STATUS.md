# OrderSync Build Status

Last verified: 2026-09-09

This is the repository-level source of truth for implementation status. Client task trackers describe intended client work and are not evidence that backend or cross-client behavior is complete.

## Delivery phases

| Phase | Status | Notes |
| --- | --- | --- |
| 0 — Repository audit | Complete | Read-only architecture and gap audit completed. |
| 1 — Engineering foundation and PostgreSQL | Complete | Verified locally on PostgreSQL 17.2; CI definition added for all three surfaces. |
| 2 — Multi-tenancy, authentication, authorization | Complete | Tenant-bound authentication, role enforcement, policy checks, client login integration, and audit foundation verified. |
| 3 — SaaS administration and subscriptions | Complete | Business lifecycle, fixed plans/configurable entitlements, subscriptions, internal billing, platform dashboard, and user status administration verified. |
| 4 — Catalog and inventory | Complete | Tenant catalog, product images, transactional stock, immutable movement history, low-stock alerts, and React integration verified. |
| 5 — Point of sale | Complete | Tenant POS, server-authoritative totals, idempotent finalization, atomic stock deduction, recorded payments, receipts, and history verified. |
| 6 — Customer storefront and ordering | Complete | Public tenant storefronts, real React/Flutter catalogs, carts, idempotent pickup ordering, status workflow, customer cancellation, and transactional confirmation verified. |
| 7 — Recorded GCash and Maya payments | Not started | Requires separate approval. |
| 8 — Messaging, realtime events, notifications | Not started | Requires separate approval. |
| 9 — Analytics and reports | Not started | Requires separate approval. |
| 10 — AI customer support | Not started | Requires separate approval and provider evaluation. |
| 11 — Progressive Web App and offline safety | Not started | Requires separate approval. |
| 12 — Hardening, migration, release readiness | Not started | Production deployment remains separately approved. |

## Phase 1 baseline

- Git repository initialized on `main`; no remote configured.
- Laravel uses PostgreSQL defaults for development and tests.
- Local databases are separated into `ordersync` and `ordersync_test` with non-superuser owners.
- PHP PostgreSQL extensions are enabled in the active Laragon PHP installation.
- A non-sensitive `GET /api/v1/health` contract is available.
- CI is defined for Laravel/PostgreSQL, React, and Flutter.
- No SaaS business tables or business modules have been implemented.

## Phase 2 baseline

- Global users are separated from tenant memberships and businesses.
- `SUPER_ADMIN` is a platform role; `BUSINESS_OWNER`, `STAFF`, `CASHIER`, and `CUSTOMER` are membership roles.
- Opaque access tokens are short-lived; refresh tokens are single-use and rotate transactionally.
- PostgreSQL stores only SHA-256 token hashes, never the issued plaintext values.
- Tenant tokens are bound to one `business_id`; an `X-Business-Id` override is rejected.
- Account and membership deactivation take effect when a token is next presented.
- Laravel middleware, role checks, and `BusinessPolicy` provide server-side authorization foundations.
- Authentication and security-sensitive session events create append-only audit records.
- React uses real Laravel authentication by default while later-phase business modules remain on MSW.
- Flutter has a real customer login/logout contract and typed mobile session parsing.

See [`AUTH_TENANCY.md`](AUTH_TENANCY.md) for the role, token, API, and tenant-boundary contract.

## Phase 3 baseline

- Public business registration transactionally creates a pending business, owner identity, and owner membership.
- Only a Super Admin can approve, suspend, or reactivate businesses; suspension revokes existing tenant sessions while preserving data.
- Basic, Standard, and Premium plan codes are fixed while price, grace days, availability, and feature/usage entitlements remain configurable.
- Every business has at most one current subscription; assignment, renewal, grace, cancellation, and plan changes create append-only history.
- Effective subscription status is derived from paid-period and grace deadlines rather than trusting client state.
- Billing records are internal/manual PHP records and never imply payment-provider confirmation.
- Super Admin APIs and React controls cover platform metrics, businesses, plans, subscriptions, billing records, and user activation.
- A Business Owner can read only the subscription and entitlements bound to the authenticated tenant token.

See [`SAAS_ADMINISTRATION.md`](SAAS_ADMINISTRATION.md) for lifecycle rules, API contracts, entitlement behavior, and audit coverage.

## Phase 4 baseline

- PostgreSQL is authoritative for tenant categories, products, product images, current stock, append-only stock movements, and persisted reorder alerts.
- Category names are case-insensitively unique per business; normalized SKU and non-null barcode are unique per business.
- Product creation initializes stock transactionally; subsequent stock changes are accepted only by inventory mutation endpoints.
- Manual adjustments, multi-line restocks, alert synchronization, and audit writes run inside PostgreSQL transactions with row locks and non-negative constraints.
- Business Owners and Staff can manage catalog and inventory; Cashiers can read catalog, stock, alerts, and movement history only.
- Effective subscription state and the `catalog_enabled` or `inventory_enabled` entitlement gate every module route.
- Local JPEG, PNG, and WebP product images use Laravel's public disk with a 4 MB limit and tenant-specific paths.
- React catalog and inventory calls use real Laravel APIs in normal development, and tenant query keys include the authenticated business ID.
- Reorder-alert records are ready for later notification delivery; Phase 8 remains responsible for realtime and push transport.

See [`CATALOG_INVENTORY.md`](CATALOG_INVENTORY.md) for schema rules, API contracts, permissions, transaction behavior, and image handling.

## Phase 5 baseline

- PostgreSQL is authoritative for completed tenant sales, sale-line snapshots, receipt identifiers, payment records, and idempotency state.
- Business Owners, Staff, and Cashiers can complete sales and read tenant history when the subscription is effective and `pos_enabled`; only Business Owners can discount lines.
- Laravel reloads products and integer-minor-unit prices from PostgreSQL, calculates all totals, and rejects inactive, missing, foreign-tenant, or understocked products.
- Checkout locks idempotency and stock state, deducts inventory, appends `POS_SALE` movements, synchronizes reorder alerts, writes receipt snapshots, and audits completion in one transaction.
- Identical retries return the original sale without another deduction; reuse of a checkout key with a different normalized request returns a conflict.
- Cash records tender and calculated change. GCash, Maya, card, and other methods record a required reference only and do not imply provider confirmation.
- Completed sales and lines are immutable through the application model contract, and historical receipt values remain stable after catalog edits.
- React POS and sales history use real Laravel APIs in normal development, keep drafts in per-tab session storage, and clear a cart only after confirmed finalization.
- Phase 5 intentionally records a zero tax rate because tenant tax configuration is outside the approved scope.

See [`POINT_OF_SALE.md`](POINT_OF_SALE.md) for data rules, API contracts, idempotency, transaction behavior, roles, and payment limitations.

## Phase 6 baseline

- PostgreSQL is authoritative for pickup orders, immutable line snapshots, status history, customer identity snapshots, and tenant/customer-scoped idempotency.
- Public storefronts expose only Active businesses whose effective subscription includes `customer_ordering_enabled`; public catalog responses omit business-only cost data.
- Customer APIs return only orders owned by the authenticated customer in the token-bound tenant; business APIs return only the bound tenant's orders.
- Placement validates current availability and reloads product names, SKUs, and prices from PostgreSQL, but intentionally does not reserve or deduct stock.
- The first business confirmation transactionally rechecks and deducts stock, increments versions, writes `ORDER_CONFIRMED` movements, synchronizes reorder alerts, appends history, and audits the transition.
- The pickup workflow is `PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → COMPLETED`; Pending may instead be Rejected with a reason or Cancelled by its customer.
- React provides a public `/shop` directory and storefront, tenant-scoped session cart, retry-stable idempotency, customer history/cancellation, and real business order controls.
- Flutter uses the same real storefront/order API for catalog, cart, pickup checkout, history, status timeline, and Pending-only cancellation, and clears customer state across auth or tenant boundaries.

See [`CUSTOMER_ORDERING.md`](CUSTOMER_ORDERING.md) for eligibility, API contracts, pricing, status, stock, client, and deferral rules.

## Validation matrix

| Surface | Command/check | Result |
| --- | --- | --- |
| PostgreSQL | Version, ownership, connectivity | Passed — PostgreSQL 17.2; separate non-superuser owners for `ordersync` and `ordersync_test` |
| Laravel | Development migration, isolated test rebuild, route, tests | Passed — 3 migrations; 4 tests and 8 assertions; health route registered at `/api/v1/health` |
| React | Lint, typecheck, tests, production build | Passed — 0 lint errors, typecheck clean, 29 tests, build complete |
| Flutter | Dependency resolution, format, analyze, tests | Passed — format clean, no analysis issues, 1 widget test passed |
| CI definition | Workflow and local-equivalent commands | Added — hosted execution awaits a future remote repository; no external account was created |
| Git | Ignore/secret review, staged-content check, baseline commit | Passed — runtime secrets and generated artifacts excluded; staged diff clean |

## Phase 2 validation matrix

| Surface | Command/check | Result |
| --- | --- | --- |
| PostgreSQL | Additive development migration and isolated test rebuild | Passed — 4 migrations; business, membership, token, and audit constraints created |
| Laravel | Pint and complete PHPUnit suite | Passed — formatting clean; 17 tests and 86 assertions |
| Tenant security | Header override, membership revocation, role middleware, model policy | Passed — cross-tenant and unauthorized access rejected |
| Token lifecycle | Login, hashed storage, rotation, replay, logout, password change | Passed — refresh tokens are single-use and other sessions are revoked after password change |
| React | Lint, typecheck, tests, production build | Passed — 0 lint errors, clean typecheck, 32 tests, build complete |
| Flutter | Format, analyze, tests | Passed — 71 files clean, no analysis issues, 3 tests |
| Hosted CI | Workflow definition | Not executed — no remote repository or external account was authorized |

## Phase 3 validation matrix

| Surface | Command/check | Result |
| --- | --- | --- |
| PostgreSQL | Additive development migrations and isolated test rebuild | Passed — 6 migrations; lifecycle, plan, entitlement, subscription, billing, history, and normalized-email constraints created |
| Laravel | Pint and complete PHPUnit suite | Passed — formatting clean; 25 tests and 165 assertions |
| Business lifecycle | Registration, approval, suspension, reactivation, session revocation, data preservation | Passed |
| Subscription security | Super Admin route enforcement, tenant-bound owner read, immutable history, lockout prevention | Passed |
| React | Lint, typecheck, tests, production build | Passed — 0 lint errors, clean typecheck, 38 tests, build complete |
| Flutter | Phase 3 scope review | No source change required; Phase 2 authentication baseline remains applicable |
| Hosted CI | Workflow definition | Not executed — no remote repository or external account was authorized |

## Phase 4 validation matrix

| Surface | Command/check | Result |
| --- | --- | --- |
| PostgreSQL | Additive development migration and isolated test rebuild | Passed — 7 migrations; tenant catalog, images, stock, movement, alert, index, foreign-key, and check constraints created |
| Laravel | Pint and complete PHPUnit suite | Passed — formatting clean; 33 tests and 258 assertions |
| Catalog/inventory security | Cross-tenant IDs, per-business uniqueness, roles, entitlements, inactive subscriptions | Passed — foreign tenant records hidden; Cashier writes and unavailable features rejected |
| Stock consistency | Negative adjustments, atomic restock, immutable history, alert lifecycle | Passed — rollback and before/after/version invariants verified |
| Concurrency | 12 independent workers incrementing one stock row | Passed — quantity 12, version 12, and 12 immutable movements; no lost update |
| Product images | MIME/size validation, tenant path, replacement cleanup | Passed with isolated public-disk storage |
| React | Lint, typecheck, tests, production build | Passed — 0 lint errors (21 existing warnings), clean typecheck, 39 tests, build complete |
| Flutter | Phase 4 scope review | No source change required; customer catalog integration remains assigned to Phase 6 |
| Hosted CI | Workflow definition | Not executed — no remote repository or external account was authorized |

## Phase 5 validation matrix

| Surface | Command/check | Result |
| --- | --- | --- |
| PostgreSQL | Additive development migration and isolated test rebuild | Passed — 8 migrations; tenant sales, line snapshots, idempotency uniqueness, payment, total, index, foreign-key, and check constraints created |
| Laravel | Pint and complete PHPUnit suite | Passed — formatting clean; 43 tests and 351 assertions |
| POS authorization | Tenant boundary, roles, entitlement, subscription, owner-only discounts | Passed — foreign sales hidden; Cashier sale/history allowed; unauthorized discounts and unavailable POS rejected |
| Transaction safety | Server pricing, tender, multi-line stock, immutable snapshots, audit | Passed — invalid checkout fully rolls back; successful lines deduct once and create consistent receipts |
| Idempotency | Replay, payload mismatch, tenant scope, 8 simultaneous workers | Passed — 1 sale, 1 line, 1 movement, quantity 9/version 1; 1 create and 7 replays |
| Recorded payments | Cash, GCash reference, nullable tender/change rules | Passed — references persist without any provider-confirmation claim |
| React | Lint, typecheck, tests, production build | Passed — 0 lint errors (20 existing warnings), clean typecheck, 40 tests, build complete |
| Flutter | Phase 5 scope review | No source change required; customer storefront and ordering remain assigned to Phase 6 |
| Hosted CI | Workflow definition | Not executed — no remote repository or external account was authorized |

## Phase 6 validation matrix

| Surface | Command/check | Result |
| --- | --- | --- |
| PostgreSQL | Additive development migration and explicitly isolated test rebuild | Passed — 9 migrations; order, line, status-event, idempotency, total, index, foreign-key, and check constraints created |
| Laravel | Pint and complete PHPUnit suite | Passed — formatting clean; 51 tests and 450 assertions |
| Storefront/order security | Public field filtering, effective subscription, roles, ownership, tenant IDs | Passed — ineligible storefronts hidden; foreign products and orders rejected or hidden; customer/business roles enforced |
| Transaction safety | Multi-line confirmation, rollback, snapshots, status history, audit | Passed — failing confirmation changes no order, stock, movement, event, or audit state |
| Idempotency and concurrency | Placement replay/mismatch and 4 simultaneous confirmations | Passed — one confirmation, three illegal repeats, one stock deduction/movement, quantity 8/version 1 |
| React | Lint, typecheck, tests, production build | Passed — 0 lint errors (20 existing warnings), clean typecheck, 43 tests, build complete |
| Flutter | Format, analyze, tests | Passed — 76 files formatted, no analysis issues, 8 tests |
| Hosted CI | Workflow definition | Not executed — no remote repository or external account was authorized |

## Known limitations

- React messaging, reports, settings, and remaining non-Phase-6 prototype areas still depend on MSW fixtures.
- React lint retains 20 non-blocking warnings, and the production build reports a 2.81 MB main chunk that should be code-split in a later web phase.
- Flutter storefront, catalog, cart, checkout, and customer orders use real APIs; messaging, notifications, account editing, and other later-phase screens remain prototype-only.
- Flutter tokens are intentionally memory-only because no encrypted-storage dependency was approved for Phase 2; cold-start restoration remains deferred.
- Flutter storefront, cart, and last-known orders are memory-only and do not survive a cold app restart because no new persistence dependency was approved for Phase 6.
- Android release packaging was not part of Phase 1; JDK 17 remains required before release-oriented work.
- The Flutter lockfile currently has 34 newer package versions outside its existing dependency constraints; no dependency upgrade was authorized in this phase.
- Plan prices are intentionally unconfigured by default and require an approved Super Admin value before bills are created.
- Subscription status is evaluated on reads; no external scheduler or automatic invoicing service was introduced.
- Platform user administration currently covers visibility and activation status; self-deactivation and last-Super-Admin lockout are prohibited.
- Reorder alerts are persisted but external realtime/push notification delivery is deferred to Phase 8.
- Local product images use Laravel's public disk; production object-storage configuration and image lifecycle operations are deferred to release hardening.
- POS tax remains zero until tenant tax settings and applicable fiscal requirements receive a separately approved design.
- POS GCash, Maya, card, and other non-cash references are recorded but not provider-confirmed; proof upload and manual verification remain Phase 7 work.
- Completed sales have no void, return, refund, or correction workflow; direct mutation is intentionally prohibited.
- Customer orders are pickup-only, placement does not reserve stock, and confirmed orders have no customer cancellation, refund, or automatic restock workflow.
- No payment-proof verification, notification transport, AI, PWA/offline safety, or deployment implementation exists yet.
- The local `ordersync` development database is migrated but empty; pilot/demo rows were not recreated after the approved decision to leave it empty.
- The local Laragon PostgreSQL cluster uses trusted loopback authentication; non-local environments must use passwords or managed identity.

## Current decisions

- PostgreSQL is authoritative; SQLite is ignored and unsupported as fallback.
- Local PostgreSQL is managed by Laragon.
- CI defaults to GitHub Actions; no remote repository or external account was created.
- Node 22 is retained for the current workstation and CI baseline. Barcode dependency engine compatibility remains a later POS concern.
- Authentication uses hashed opaque tokens instead of a new authentication package; browser refresh tokens use an HttpOnly cookie and mobile refresh tokens use the native response contract.
- PostgreSQL connections are pinned to UTC; each business retains an explicit display timezone.
- Business suspension preserves all tenant data but blocks new and existing tenant sessions until Super Admin reactivation.
- Subscription billing is an internal/manual record in Phase 3; no gateway, wallet API, external account, or provider confirmation exists.
- Catalog and inventory access is subscription-entitlement gated; server-side tenant filters remain authoritative over client route guards.
- Stock changes lock the stock row, forbid negative results, increment a version, append a movement, and synchronize the reorder alert in one transaction.
- Phase 4 development product images use Laravel's local public disk; no external storage service was introduced.
- POS totals and product snapshots are server-owned; checkout idempotency is tenant-scoped, and stock plus receipt persistence is one PostgreSQL transaction.
- Recorded non-cash POS methods never imply GCash, Maya, card-provider, or other external confirmation.
- Customer order placement is idempotent per business/customer/key; stock is deducted only on the first locked business confirmation.
- Phase 6 fulfillment is pickup-only. A customer can cancel only while Pending; rejection requires a business reason, and later refund/restock behavior is deferred.
