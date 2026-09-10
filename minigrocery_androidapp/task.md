# Task Tracker — OrderSync Customer Android App

Granular, checkbox-driven tracker that mirrors `implementation_plan.md` 1:1. Update statuses as work progresses.

This tracker covers the customer Android client within the OrderSync multi-tenant SaaS platform. Tonette's Minimart is only the pilot tenant.

> Repository delivery status is tracked in [`../docs/BUILD_STATUS.md`](../docs/BUILD_STATUS.md). The checklist below remains the client-specific implementation tracker; Phase 1 repository-foundation work does not imply production readiness of the Flutter prototype.

## Repository delivery checkpoint

- [x] 2026-09-07 — Phase 1 engineering foundation verified: dependencies resolve, formatting and analysis are clean, the boot widget test passes, and the shared CI baseline is present. See [`../docs/BUILD_STATUS.md`](../docs/BUILD_STATUS.md).
- [x] 2026-09-08 — Phase 2 mobile auth integration verified: typed roles/session parsing, real customer login, business selection, rotating mobile refresh contract, profile identity, and server logout. Tokens remain memory-only pending approval of encrypted storage. See [`../docs/AUTH_TENANCY.md`](../docs/AUTH_TENANCY.md).
- [x] 2026-09-08 — Phase 3 backend subscription boundary verified with no Flutter scope change: suspended businesses cannot refresh customer sessions, while customer-facing subscription and catalog experiences remain deferred. See [`../docs/SAAS_ADMINISTRATION.md`](../docs/SAAS_ADMINISTRATION.md).
- [x] 2026-09-08 — Phase 4 backend catalog and inventory contracts verified with no Flutter source change: tenant-safe read APIs now exist, while customer catalog integration remains assigned to the separately approved customer-storefront phase. See [`../docs/CATALOG_INVENTORY.md`](../docs/CATALOG_INVENTORY.md).
- [x] 2026-09-08 — Phase 5 business POS verified with no Flutter source change: completed tenant sales now deduct stock transactionally, while the customer app's storefront, cart, checkout, and orders remain assigned to Phase 6. See [`../docs/POINT_OF_SALE.md`](../docs/POINT_OF_SALE.md).
- [x] 2026-09-09 — Phase 6 customer storefront and ordering verified: the authenticated tenant's live catalog, stock-capped cart, retry-safe pickup checkout, real order history/status timeline, pending-only cancellation, and tenant-bound state clearing now use Laravel APIs. See [`../docs/CUSTOMER_ORDERING.md`](../docs/CUSTOMER_ORDERING.md).
- [x] 2026-09-09 — Phase 7 customer payments verified: authenticated GCash/Maya instructions and private QR images, camera/gallery proof selection, multipart upload, and manual review/receipt status now use Laravel APIs. See [`../docs/RECORDED_PAYMENTS.md`](../docs/RECORDED_PAYMENTS.md).
- [x] 2026-09-10 — Phase 8 customer messaging and foreground notifications verified: real general/order threads, immutable history, unread state, notification inbox/preferences, durable five-second polling, and in-app foreground banners now use Laravel APIs. External background push remains separately deferred. See [`../docs/MESSAGING_NOTIFICATIONS.md`](../docs/MESSAGING_NOTIFICATIONS.md).
- [x] 2026-09-10 — Phase 9 backend/web analytics verified with no Android source change: tenant dashboards, PostgreSQL-reconciled reports, and browser CSV/PDF exports are business-workspace capabilities; customer mobile reporting was not included in the approved scope. See [`../docs/ANALYTICS_REPORTS.md`](../docs/ANALYTICS_REPORTS.md).
- [x] 2026-09-10 — Phase 10 customer AI support verified: explicit Ask AI mode, published tenant FAQ/announcement suggestions, provider-free grounded answers, visible AI labels, safe error fallback, preserved conversations, and one-tap human handoff use real Laravel APIs. See [`../docs/AI_CUSTOMER_SUPPORT.md`](../docs/AI_CUSTOMER_SUPPORT.md).

## Legend

| Marker | Meaning |
| --- | --- |
| ☐ | To do (use `- [ ]`) |
| 🔄 | In progress (use `- [~]` in comments, or annotate with `🔄`) |
| ✅ | Done (use `- [x]`) |
| ⛔ | Blocked (annotate with `⛔` and link the blocker) |

---

## Phase 1 — Scaffolding, theming, routing, environment config

- [ ] Replace placeholder `lib/main.dart` with a `runApp(ProviderScope(child: OrderSyncApp()))` bootstrap
- [ ] Create `lib/app.dart` with `MaterialApp.router` wired to `go_router`
- [ ] Add dependencies to `pubspec.yaml`: `flutter_riverpod`, `riverpod_annotation`, `go_router`, `dio`, `retrofit`, `json_annotation`, `flutter_secure_storage`, `hive_ce`, `hive_ce_flutter`, `shared_preferences`, `firebase_core`, `firebase_messaging`, `flutter_local_notifications`, `stomp_dart_client`, `connectivity_plus`, `intl`
- [ ] Add dev dependencies: `build_runner`, `riverpod_generator`, `retrofit_generator`, `json_serializable`, `hive_ce_generator`, `mocktail`, `integration_test`
- [ ] Create `lib/core/config/env.dart` reading API, realtime, FCM, AI-support, and payment-proof limits from `String.fromEnvironment`
- [ ] Create `lib/core/config/app_config.dart` exposing typed flags (`isProd`, `httpLogsEnabled`)
- [ ] Create `lib/core/theme/app_colors.dart` and `lib/core/theme/app_theme.dart` (light theme + Material 3 seed)
- [ ] Create `lib/core/routing/routes.dart` (route name constants) and `lib/core/routing/app_router.dart` (`go_router` with auth-guard redirect)
- [ ] Add business/storefront selector and placeholder Catalog, Cart, Orders, Messages/AI Support, and Account screens
- [ ] Add bottom-navigation shell wrapping the five top-level routes
- [ ] Verify `flutter run --dart-define=ENV=dev ...` boots into the themed shell
- [ ] Verify `dart run build_runner build --delete-conflicting-outputs` runs clean

---

## Phase 2 — Authentication

- [ ] Create `lib/features/auth/domain/entities/user.dart` and `auth_tokens.dart`
- [ ] Create `lib/features/auth/domain/repositories/auth_repository.dart` (interface)
- [ ] Create `lib/features/auth/data/dtos/` (`login_request.dart`, `register_request.dart`, `auth_response.dart`)
- [ ] Create `lib/features/auth/data/api/auth_api.dart` (Retrofit) with `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `GET /auth/me`
- [ ] Implement `lib/features/auth/data/repositories/auth_repository_impl.dart`
- [ ] Implement `lib/core/storage/secure_storage.dart` wrapping `flutter_secure_storage` for `accessToken`, `refreshToken`, `expiresAt`
- [ ] Implement `lib/core/network/interceptors/auth_interceptor.dart`
- [ ] Implement `lib/core/network/interceptors/refresh_interceptor.dart` with a `Mutex` and request queue
- [ ] Implement `lib/core/network/interceptors/logging_interceptor.dart` (dev/staging only, redacts `Authorization`)
- [ ] Implement `lib/core/network/dio_client.dart` assembling Dio + interceptors
- [ ] Implement `lib/core/network/api_exception.dart` and `Failure` sealed class
- [ ] Build `lib/features/auth/presentation/login_screen.dart` (email, password, validation, submit)
- [ ] Build `lib/features/auth/presentation/register_screen.dart`
- [ ] Build `lib/features/auth/presentation/controllers/auth_controller.dart` (Riverpod async notifier)
- [ ] Wire auto-login on cold start in `app.dart` / router redirect
- [ ] Add `BusinessSummary` and selected-business context with tenant-safe deep-link validation
- [ ] Namespace Hive boxes, Riverpod provider families, routes, and requests by `businessId`
- [ ] Implement logout: clear secure storage, reset providers, route to `/login`
- [ ] Write unit tests for `AuthRepositoryImpl` and `RefreshInterceptor` mutex behavior

---

## Phase 3 — Tenant-scoped product catalog

- [ ] Create `lib/features/catalog/domain/entities/` — `category.dart`, `product.dart`
- [ ] Create `lib/features/catalog/data/dtos/` — `category_dto.dart`, `product_dto.dart` with mappers
- [ ] Create `lib/features/catalog/data/api/catalog_api.dart` — `GET /products` (paginated, filters), `GET /products/{id}`, `GET /categories`
- [ ] Implement `lib/features/catalog/data/repositories/product_repository_impl.dart` with Hive cache fallback (`box: catalog_cache`)
- [ ] Implement `lib/features/catalog/data/repositories/category_repository_impl.dart`
- [ ] Register Hive boxes in `lib/core/storage/hive_boxes.dart`
- [ ] Build `lib/features/catalog/presentation/product_list_screen.dart` — responsive grid, pull-to-refresh, infinite scroll pagination
- [ ] Build `lib/features/catalog/presentation/widgets/product_card.dart` (price, stock badge, disabled when out of stock)
- [ ] Build `lib/features/catalog/presentation/widgets/category_filter_bar.dart` (horizontal chips)
- [ ] Build `lib/features/catalog/presentation/widgets/search_bar.dart` with 300ms debounce
- [ ] Build `lib/features/catalog/presentation/product_detail_screen.dart`
- [ ] Build skeleton loader widgets for product grid and detail
- [ ] Unit test: paginated provider emits expected `AsyncValue` sequence
- [ ] Widget test: out-of-stock product shows disabled CTA
- [ ] Integration test: switching storefronts clears/reloads tenant-scoped catalog and cart data without leakage

---

## Phase 4 — Cart management

- [ ] Create `lib/features/cart/domain/entities/cart_item.dart` and `cart.dart`
- [ ] Register Hive box `cart` and generate adapters
- [ ] Implement `lib/features/cart/data/cart_local_data_source.dart` (Hive CRUD)
- [ ] Implement `lib/features/cart/data/cart_repository_impl.dart`
- [ ] Build `lib/features/cart/presentation/controllers/cart_controller.dart` (Riverpod)
- [ ] Build `lib/features/cart/presentation/cart_screen.dart` (line items, qty +/-, swipe to delete, subtotal)
- [ ] Add "Add to Cart" action on `product_detail_screen.dart` (respects `stockOnHand` cap)
- [ ] Add cart icon with item-count badge in app bar
- [ ] Add "Clear cart" with confirmation dialog
- [ ] Persist cart across app restarts; verify with integration scenario
- [ ] Unit test: quantity cannot exceed `stockOnHand`

---

## Phase 5 — Checkout & order creation

- [ ] Create `lib/features/checkout/domain/entities/checkout_input.dart`
- [ ] Create `lib/features/orders/data/dtos/create_order_request.dart` and `order_dto.dart`
- [ ] Create `lib/features/orders/data/api/order_api.dart` — `POST /orders`, `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel`
- [ ] Implement `lib/features/orders/data/repositories/order_repository_impl.dart`
- [ ] Build `lib/features/checkout/presentation/checkout_screen.dart` (review items, optional notes, pickup/contact info, submit)
- [ ] Build `lib/features/checkout/presentation/controllers/checkout_controller.dart`
- [ ] On success: clear cart atomically, navigate to new order detail
- [ ] Surface server validation errors (e.g., inactive product) inline
- [ ] Unit test: cart not cleared if `POST /orders` fails

---

## Phase 6 — Order tracking & history

- [ ] Create `lib/features/orders/domain/entities/order.dart`, `order_item.dart`, `order_status.dart` (enum), `order_status_event.dart`
- [ ] Build `lib/features/orders/presentation/order_list_screen.dart` with Active / History tabs
- [ ] Build `lib/features/orders/presentation/widgets/order_status_chip.dart` for all seven statuses
- [ ] Build `lib/features/orders/presentation/order_detail_screen.dart` with timeline widget
- [ ] Build `lib/features/orders/presentation/widgets/order_timeline.dart`
- [ ] Implement cancel-order action (visible only when status is `PENDING`)
- [ ] Pull-to-refresh on order list and order detail
- [ ] Cache last-known orders in Hive box `orders_cache` for offline view
- [ ] Widget test: each `OrderStatus` renders a distinct chip
- [ ] Unit test: cancelling a `CONFIRMED` order is rejected by repository guard

---

## Phase 7 — In-app messaging & AI handoff foundation

- [ ] Create `lib/features/messaging/domain/entities/` — `chat_thread.dart`, `message.dart`
- [ ] Create `lib/features/messaging/data/dtos/` and REST API for thread list + history (`GET /threads`, `GET /threads/{id}/messages`)
- [ ] Implement `lib/core/websocket/stomp_client.dart` with connect, subscribe, send, heartbeat, exponential-backoff reconnect
- [ ] Subscribe only to destinations authorized for the signed-in customer and selected business
- [ ] Implement `lib/features/messaging/data/messaging_repository_impl.dart` merging REST history + WS stream
- [ ] Build `lib/features/messaging/presentation/chat_thread_list_screen.dart` with unread badges
- [ ] Build `lib/features/messaging/presentation/chat_thread_screen.dart` with optimistic send + ack reconciliation
- [ ] Build `lib/features/messaging/presentation/widgets/message_bubble.dart` (incoming/outgoing, timestamps, read state)
- [ ] Mark thread read on open (`POST /threads/{id}/read`)
- [ ] Implement polling fallback provider behind a feature flag (`useWebSocketChat`)
- [ ] Reconnect on app resume; disconnect after 30s in background
- [ ] Unit test: backoff sequence caps at 30s; jitter applied

---

## Phase 8 — Recorded GCash/Maya payments

- [ ] Create payment entities/DTOs for method, reference number, proof URL, status, timestamps, and rejection reason
- [ ] Add `PaymentApi` endpoints for proof upload, submit, status, history, and digital receipt
- [ ] Build business-managed GCash/Maya QR instructions with clear manual-verification language; do not call wallet APIs in MVP
- [ ] Build camera/gallery screenshot-or-receipt picker with preview, compression, type/size validation, progress, retry, and cancel
- [ ] Keep payment proof private and fetch it only through authorized backend access
- [ ] Show pending, verified, and rejected status plus verification history on order detail
- [ ] Ensure order/fulfillment state changes only after server-confirmed payment policy
- [ ] Integration test: submit proof and prevent access from a different customer or business

---

## Phase 9 — AI-assisted customer support

- [x] Add `AiSupportApi` and message models without embedding any provider API key in the app
- [x] Build AI-support entry point with visible AI label and suggested product/stock/order/FAQ questions
- [x] Pass only the selected business and authorized order context to backend tools
- [x] Display business announcements and tenant-published FAQ answers
- [x] Add uncertainty/error fallback and one-tap human handoff to the business chat
- [x] Preserve the conversation when handoff occurs and distinguish AI from human messages
- [x] Test prompt-injection attempts, cross-tenant queries, and attempts to read another customer's order

---

## Phase 10 — Firebase Cloud Messaging

- [ ] Add `google-services.json` to `android/app/` (gitignored) and document placeholder for contributors
- [ ] Update `android/build.gradle.kts` / `android/app/build.gradle.kts` for `google-services` plugin
- [ ] Add `POST_NOTIFICATIONS` runtime permission request (Android 13+)
- [ ] Initialize Firebase in `lib/main.dart`
- [ ] Implement `lib/core/notifications/fcm_service.dart`: request permission, get token, register with backend (`POST /devices`), listen for `onTokenRefresh`
- [ ] Implement `lib/core/notifications/local_notifications.dart` for foreground display
- [ ] Implement top-level background message handler (`@pragma('vm:entry-point')`)
- [ ] Map `NotificationPayload.type` to deep-link routes via `go_router`
- [ ] Deduplicate against in-app updates when the matching screen is foreground
- [ ] Manual test matrix: foreground / background / terminated for `ORDER` and `MESSAGE` types

---

## Phase 11 — Polish

- [ ] Add reusable `lib/core/widgets/skeletons/` (list, grid, detail)
- [ ] Add reusable `lib/core/widgets/empty_state.dart` and `error_state.dart` with retry callback
- [ ] Add `lib/core/widgets/snackbar_service.dart` (global, provider-driven)
- [ ] Add offline banner driven by `connectivity_plus`
- [ ] Accessibility pass: semantics labels, tap-target sizes ≥ 48dp, contrast check
- [ ] Add `flutter_native_splash` config and generate splash assets
- [ ] Add adaptive launcher icon via `flutter_launcher_icons`
- [ ] Localization scaffold under `lib/l10n/` with English baseline (`intl_en.arb`)
- [ ] Apply consistent typography scale from `app_theme.dart` across all screens

---

## Phase 12 — Testing, hardening, release

- [ ] Author integration test: login → select business → browse → cart → checkout → payment proof → order detail
- [ ] Author tenant-isolation and AI-to-human-handoff integration tests
- [ ] Author integration test: cold start with valid token skips login
- [ ] Add CI workflow (GitHub Actions or equivalent): `flutter pub get`, `dart run build_runner build`, `flutter analyze`, `flutter test --coverage`, `flutter build appbundle`
- [ ] Configure release signing via `android/key.properties` (gitignored) and `build.gradle.kts`
- [ ] Add ProGuard / R8 keep rules for Firebase, STOMP, and `json_serializable` models
- [ ] Set `android:usesCleartextTraffic="false"` and add a network security config
- [ ] Audit `AndroidManifest.xml` permissions — keep to `INTERNET` and `POST_NOTIFICATIONS`
- [ ] Fill Play Console data-safety form draft
- [ ] Produce internal-testing AAB; install on a clean device; record crash-free metric over 24h soak
- [ ] Draft v1.0 release notes

---

## Backlog / Nice-to-Have

- [ ] Customer loyalty / points balance surface
- [ ] Scheduled promotion banner on Catalog home
- [ ] Printable / shareable receipt for `COMPLETED` orders
- [ ] Biometric unlock for app launch
- [ ] Dark mode theme variant
- [ ] In-app product reviews / ratings
- [ ] Saved favorites / wishlist
- [ ] CSV export viewer for past orders
- [ ] Multi-language support beyond English
- [ ] Customer-ordering PWA parity validation against the web client

---

## Blocked / Waiting on Backend

- [ ] ⛔ Final API spec for auth, businesses/storefronts, products, orders, payments/uploads, threads, AI support, and notifications
- [ ] ⛔ Refresh-token contract (lifetime, rotation policy, revoke endpoint)
- [ ] ⛔ Realtime endpoint, tenant destination naming, and auth handshake
- [ ] ⛔ FCM server key and `POST /devices` registration endpoint
- [ ] ⛔ Order-cancellation policy (which statuses are cancellable by the customer)
- [ ] ⛔ Pagination contract (page/size vs. cursor) for catalog and orders
- [ ] ⛔ Image hosting / CDN base URL for `Product.imageUrl`
- [ ] ⛔ GCash/Maya proof formats, maximum size, private storage, retention, verification, and rejection rules
- [ ] ⛔ AI provider decision criteria, cost ceiling, privacy/retention policy, knowledge endpoints, and handoff rules
