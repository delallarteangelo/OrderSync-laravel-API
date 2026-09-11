# Progressive Web App and Offline Safety

Phase 11 makes the OrderSync React client installable and mobile-friendly while keeping server-owned commerce state authoritative. It introduces no deployment, external account, paid service, background synchronization service, or new backend/database behavior.

## Install and update flow

- `manifest.webmanifest` defines the OrderSync name, `/shop` start URL, standalone display, green theme, and regular/maskable SVG icons.
- The production client registers `/sw.js`. Development sessions do not register the PWA worker, and MSW-enabled sessions are also excluded, preventing stale local caches and service-worker scope conflicts.
- The install action is displayed only when the browser raises `beforeinstallprompt`.
- A waiting worker produces an explicit update action. Selecting it sends `SKIP_WAITING`, waits for `controllerchange`, and reloads once under the new version.
- Cache names include the service-worker version. Activation deletes only older `ordersync-pwa-*` caches.

## Cache and privacy boundary

The service worker caches the versioned application shell, built same-origin assets, and only these public API reads:

- `GET /api/v1/storefronts`
- `GET /api/v1/storefronts/{slug}`

It does not cache customer orders, payment instructions or proofs, conversation messages, AI responses, notifications, authentication endpoints, tenant administration data, or any non-GET request. An offline catalog can therefore be stale; the storefront labels it as cached, and Laravel still rechecks product price and stock when checkout resumes.

## Offline behavior

- The global status banner distinguishes offline mode and explains that sends and checkout are paused.
- The public catalog uses network-first caching and falls back to the last cached response.
- Navigation uses a network-first application-shell fallback.
- The storefront cart is stored in versioned `localStorage`, contains public product snapshots only, and is cleared when the active store changes or checkout succeeds.
- Customer message drafts are stored under a business/user/thread-scoped key and cleared after server-confirmed send, server-confirmed handoff, or sign-out.
- Orders, cancellations, payment uploads, normal messages, AI questions, and handoffs are never queued or represented as complete while offline.

## Customer mobile experience

The `/shop/{slug}` experience uses responsive catalog cards, wrapping order/payment layouts, a non-sticky mobile cart, and a compact mobile section navigator for Catalog, Cart, Orders, and Support. Authenticated customers can use a real Laravel-backed support panel with:

- normal store messages as the default mode;
- an explicit, visibly labeled grounded-AI mode;
- tenant-published FAQ and announcement suggestions;
- existing general or order conversation selection;
- one-tap human handoff;
- server-confirmed success states and retained drafts after errors.

## Verification

- TypeScript typecheck passed.
- ESLint passed with no errors; the repository retains its existing non-blocking warning set.
- Vitest passed 22 files and 62 tests, including cache allowlisting, install prompt, offline messaging, cart persistence, and sign-out draft privacy.
- The production build passed with route-level lazy loading. The initial core JavaScript is approximately 507 kB instead of the former 2.85 MB monolithic entry; large report/PDF code is loaded only when its route needs it.
- Playwright in installed Microsoft Edge passed install metadata, mobile overflow, service-worker readiness, cached catalog fallback, offline application-shell reload, and offline status checks.
- Lighthouse 12.8.2 against the local production preview scored Performance 92, Accessibility 100, Best Practices 96, and SEO 100. Lighthouse no longer supplies the former PWA category, so installability and offline behavior are covered by the dedicated Playwright test.

## Explicit deferrals

- No deployment or hosting configuration.
- No background sync of writes and no promise that a write will be retried automatically.
- No private-data caching.
- No push-notification provider or external service.
- No Android offline-persistence change.
- Broader release hardening, complete end-to-end business workflows, and deployment headers remain in the next proposed phase.
