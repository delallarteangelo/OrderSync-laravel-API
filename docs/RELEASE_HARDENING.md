# Phase 12 Release Hardening

Phase 12 prepares the OrderSync source tree for a controlled v1.0 release without selecting infrastructure or performing a deployment.

## User-interface resilience

- `LoadingState`, `EmptyState`, and `ErrorState` provide consistent accessible status semantics. Data-backed catalog, inventory, movement, order, sales, user, payment, category, and storefront surfaces now expose retryable errors and descriptive loading/empty states.
- `RouteErrorState` catches route-rendering failures and offers a reload path instead of leaving a blank screen.
- `ToastProvider` owns the global notification region and consistent duration/focus treatment.
- The PWA manager combines `navigator.onLine` with an uncached, time-bounded `/api/v1/health` heartbeat. Browser-offline and service-unreachable messages are intentionally distinct. Neither message claims that writes are queued.

## Accessibility checks

- Workspace navigation has named landmarks and a keyboard-visible skip link to a focusable main region.
- Storefront main regions support focus management; icon-only customer cart, back, notification, account, and navigation controls have accessible names.
- Loading, empty, offline, unavailable, and error feedback uses status or alert semantics as appropriate.
- Existing Radix dialogs retain focus trapping and focus restoration.
- A production-browser check covers security headers, landmarks, focus management, the mobile viewport, and offline behavior. Lighthouse accessibility scored 100.

## Security controls

- Laravel applies CSP, Permissions Policy, Referrer Policy, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY` to responses.
- Tests fail if an API route becomes public outside the documented six-route/method allowlist.
- Tests fail if a tenant-owned route loses `auth.access` or `tenant`, or if a platform route loses `auth.access` or the `SUPER_ADMIN` role requirement.
- The maintained Vite production preview and Nginx example apply matching browser-facing headers. The Nginx example also preserves SPA fallback, same-origin API/WebSocket proxying, immutable built-asset caching, and no-cache service-worker updates.
- Laravel's base test case refuses to run when the resolved database name is not exactly `ordersync_test`.

## Continuous integration

The GitHub Actions definition now runs:

- Laravel: locked install, isolated PostgreSQL migration, Pint check, complete PHPUnit suite.
- React: locked install, Prettier check, ESLint, TypeScript, complete Vitest suite, production build, Chromium installation in the ephemeral runner, and Playwright E2E against the preview.
- Flutter: locked Flutter version, dependency resolution, formatting, analysis, and tests.

This is repository configuration only. No GitHub connection, runner, remote workflow execution, or deployment was created.

## Validation results

- PostgreSQL boundary: tests resolved only `ordersync_test`; `ordersync` retained 12 migrations, fixed plan/entitlement reference rows, and zero tenant/business records.
- Laravel: Pint passed; 67 tests and 930 assertions passed.
- React: Prettier check, typecheck, and production build passed; ESLint reported 0 errors and the existing 19 warnings; 24 files and 67 tests passed.
- Flutter: formatting and analysis passed; 12 tests passed.
- Playwright with installed Microsoft Edge: 2 tests passed for headers, landmarks/focus, manifest, service worker, mobile overflow, catalog cache, and offline reload/status.
- Lighthouse 12.8.2 against the local full stack: Performance 86, Accessibility 100, Best Practices 96, SEO 100, no runtime error.

## Release boundary

[`RELEASE_RUNBOOK.md`](RELEASE_RUNBOOK.md), [`RELEASE_NOTES_V1.0.md`](RELEASE_NOTES_V1.0.md), and [`deploy/nginx.conf.example`](deploy/nginx.conf.example) are reviewable artifacts only. Target hosting, DNS, TLS, credentials, database/storage provisioning, backups, restore drills, monitoring accounts, and deployment execution remain separately approved work.
