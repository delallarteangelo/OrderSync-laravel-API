# OrderSync Build Status

Last verified: 2026-09-07

This is the repository-level source of truth for implementation status. Client task trackers describe intended client work and are not evidence that backend or cross-client behavior is complete.

## Delivery phases

| Phase | Status | Notes |
| --- | --- | --- |
| 0 — Repository audit | Complete | Read-only architecture and gap audit completed. |
| 1 — Engineering foundation and PostgreSQL | Complete | Verified locally on PostgreSQL 17.2; CI definition added for all three surfaces. |
| 2 — Multi-tenancy, authentication, authorization | Not started | Requires separate approval. |
| 3 — SaaS administration and subscriptions | Not started | Requires separate approval. |
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

## Validation matrix

| Surface | Command/check | Result |
| --- | --- | --- |
| PostgreSQL | Version, ownership, connectivity | Passed — PostgreSQL 17.2; separate non-superuser owners for `ordersync` and `ordersync_test` |
| Laravel | Development migration, isolated test rebuild, route, tests | Passed — 3 migrations; 4 tests and 8 assertions; health route registered at `/api/v1/health` |
| React | Lint, typecheck, tests, production build | Passed — 0 lint errors, typecheck clean, 29 tests, build complete |
| Flutter | Dependency resolution, format, analyze, tests | Passed — format clean, no analysis issues, 1 widget test passed |
| CI definition | Workflow and local-equivalent commands | Added — hosted execution awaits a future remote repository; no external account was created |
| Git | Ignore/secret review, staged-content check, baseline commit | Passed — runtime secrets and generated artifacts excluded; staged diff clean |

## Known limitations

- React business behavior still depends on MSW fixtures and supports only the prototype roles.
- React lint retains 21 non-blocking warnings, and the production build reports a 2.78 MB main chunk that should be code-split in a later web phase.
- Flutter remains a static design prototype with mock data.
- Android release packaging was not part of Phase 1; JDK 17 remains required before release-oriented work.
- The Flutter lockfile currently has 34 newer package versions outside its existing dependency constraints; no dependency upgrade was authorized in this phase.
- No production authentication, tenant isolation, subscription, payment, notification, AI, audit, or deployment implementation exists yet.
- The local Laragon PostgreSQL cluster uses trusted loopback authentication; non-local environments must use passwords or managed identity.

## Current decisions

- PostgreSQL is authoritative; SQLite is ignored and unsupported as fallback.
- Local PostgreSQL is managed by Laragon.
- CI defaults to GitHub Actions; no remote repository or external account was created.
- Node 22 is retained for the current workstation and CI baseline. Barcode dependency engine compatibility remains a later POS concern.
