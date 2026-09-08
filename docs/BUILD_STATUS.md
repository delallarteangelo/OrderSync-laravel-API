# OrderSync Build Status

Last verified: 2026-09-08

This is the repository-level source of truth for implementation status. Client task trackers describe intended client work and are not evidence that backend or cross-client behavior is complete.

## Delivery phases

| Phase | Status | Notes |
| --- | --- | --- |
| 0 — Repository audit | Complete | Read-only architecture and gap audit completed. |
| 1 — Engineering foundation and PostgreSQL | Complete | Verified locally on PostgreSQL 17.2; CI definition added for all three surfaces. |
| 2 — Multi-tenancy, authentication, authorization | Complete | Tenant-bound authentication, role enforcement, policy checks, client login integration, and audit foundation verified. |
| 3 — SaaS administration and subscriptions | Complete | Business lifecycle, fixed plans/configurable entitlements, subscriptions, internal billing, platform dashboard, and user status administration verified. |
| 4 — Catalog and inventory | Not started | Requires separate approval. |
| 5 — Point of sale | Not started | Requires separate approval. |
| 6 — Customer storefront and ordering | Not started | Requires separate approval. |
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

## Known limitations

- React business-operational behavior beyond authentication and SaaS administration still depends on MSW fixtures.
- React lint retains 21 non-blocking warnings, and the production build reports a 2.81 MB main chunk that should be code-split in a later web phase.
- Flutter business data remains a static design prototype; only authentication uses the real API contract.
- Flutter tokens are intentionally memory-only because no encrypted-storage dependency was approved for Phase 2; cold-start restoration remains deferred.
- Android release packaging was not part of Phase 1; JDK 17 remains required before release-oriented work.
- The Flutter lockfile currently has 34 newer package versions outside its existing dependency constraints; no dependency upgrade was authorized in this phase.
- Plan prices are intentionally unconfigured by default and require an approved Super Admin value before bills are created.
- Subscription status is evaluated on reads; no external scheduler or automatic invoicing service was introduced.
- Platform user administration currently covers visibility and activation status; self-deactivation and last-Super-Admin lockout are prohibited.
- No real catalog, inventory, POS, customer ordering, payment-proof, notification, AI, or deployment implementation exists yet.
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
