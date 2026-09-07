# OrderSync — Customer Ordering Android App

A Flutter Android application for customers of businesses using **OrderSync**, a SaaS business-management platform for micro and small businesses. Customers select or open a business storefront, browse its catalog, place and track orders, record GCash/Maya payments with proof, chat with the business or its AI assistant, and receive notifications.

Tonette's Minimart is the pilot/demo business, not the app's permanent identity. Branding, catalog, orders, messages, and payments are always resolved from the selected OrderSync business tenant.

---

## Scope of This App

This directory delivers the native **Customer Android client**. Customers never mutate stock directly. The multi-tenant backend validates the selected business, customer access, prices, availability, order transitions, and payment state before committing a change.

The OrderSync web platform provides the Super Admin console, Business Owner/Staff operations, POS, analytics, subscriptions, and a companion customer-ordering PWA.

### How it fits into the larger system

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│ Customer Android (this app)  │        │ OrderSync Web + PWA          │
│  Flutter · Android           │        │   (separate codebase)        │
└──────────────┬───────────────┘        └──────────────┬───────────────┘
               │ REST + WebSocket + FCM                │
               └───────────────┬───────────────────────┘
                               ▼
                  ┌──────────────────────────┐
                  │ Multi-tenant Laravel API │
                  │ Data · push · audit log  │
                  └──────────────────────────┘
```

---

## Key Features

### Must-Have (MVP)
- Customer registration and login (secure token storage and auto-login)
- Business selection/deep link and tenant-branded storefront
- Business-scoped product catalog with name, price, stock availability, and category
- Product search and category filter
- Cart management (add, update quantity, remove, persisted locally)
- Checkout and order creation
- Order status tracking through the full lifecycle: `PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → COMPLETED`, plus `REJECTED` and `CANCELLED`
- Per-user order history
- In-app messaging with the selected business (general + order-specific threads)
- AI-assisted product inquiry, stock availability, order-status help, FAQs, and business announcements, with visible AI labeling and human handoff
- GCash/Maya payment recording with business-managed QR instructions, reference details, and uploaded screenshot/receipt
- Payment-verification status, payment history, and digital receipts; no direct GCash/Maya API dependency in MVP
- Firebase Cloud Messaging push notifications (order updates, new messages) in foreground, background, and terminated states
- Role-restricted client — Customer role only
- Strict tenant isolation so data from one business is never shown in another storefront

### Should-Have
- Pull-to-refresh and pagination on catalog and order list
- Skeleton loaders and empty/error states
- Offline cache of last-seen catalog and order history
- Unread message badges
- Deep-link from notification → order detail or chat thread
- Camera/gallery proof upload with compression, preview, retry, and private authorized retrieval
- Clear offline indicators and safe draft preservation; final orders/payments require server confirmation

### Could-Have (Backlog)
- Customer loyalty / discount rules surface
- Promotional banner for scheduled promotions
- Printable / shareable receipt view for completed orders
- Biometric unlock
- Dark mode
- Installable customer-ordering PWA parity for users who do not install the native app

---

## Tech Stack

| Layer | Choice | Version (target) |
| --- | --- | --- |
| Framework | Flutter (stable) | ≥ 3.24 |
| Language | Dart | ≥ 3.5 |
| State management | Riverpod + `riverpod_annotation` | 2.5.x |
| Routing | `go_router` | 14.x |
| Networking | `dio` + `retrofit` | 5.x / 4.x |
| JSON | `json_serializable` + `json_annotation` | 6.x / 4.x |
| Secure storage | `flutter_secure_storage` | 9.x |
| Local cache / cart | `hive_ce` + `hive_ce_flutter` | 2.x |
| Lightweight flags | `shared_preferences` | 2.x |
| Push notifications | `firebase_core` + `firebase_messaging` | 3.x / 15.x |
| Realtime chat | `stomp_dart_client` (STOMP over WebSocket) | 2.x |
| Local notifications | `flutter_local_notifications` | 17.x |
| Codegen | `build_runner` | 2.x |
| Lints | `flutter_lints` | 5.x |
| Testing | `flutter_test`, `mocktail`, `integration_test` | — |

> Version targets are pinned at planning time. Lock exact versions in `pubspec.yaml` during Phase 1.

---

## Proposed Folder Structure

```
minigrocery_androidapp/
├── android/                         # Android platform project
├── lib/
│   ├── main.dart                    # App bootstrap, ProviderScope, FCM init
│   ├── app.dart                     # MaterialApp.router + theme wiring
│   ├── core/
│   │   ├── config/
│   │   │   ├── env.dart             # --dart-define accessors
│   │   │   └── app_config.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   └── app_colors.dart
│   │   ├── routing/
│   │   │   ├── app_router.dart      # go_router config + guards
│   │   │   └── routes.dart
│   │   ├── network/
│   │   │   ├── dio_client.dart
│   │   │   ├── interceptors/
│   │   │   │   ├── auth_interceptor.dart
│   │   │   │   ├── refresh_interceptor.dart
│   │   │   │   └── logging_interceptor.dart
│   │   │   └── api_exception.dart
│   │   ├── storage/
│   │   │   ├── secure_storage.dart
│   │   │   └── hive_boxes.dart
│   │   ├── notifications/
│   │   │   ├── fcm_service.dart
│   │   │   └── local_notifications.dart
│   │   ├── websocket/
│   │   │   └── stomp_client.dart
│   │   └── widgets/                 # shared UI widgets, skeletons, empty states
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/                # DTOs, AuthApi, AuthRepository impl
│   │   │   ├── domain/              # entities, repository interface, use cases
│   │   │   └── presentation/        # screens, controllers (Riverpod), widgets
│   │   ├── catalog/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── messaging/
│   │   ├── ai_support/
│   │   ├── businesses/              # storefront selection and tenant branding
│   │   └── notifications/
│   └── l10n/                        # i18n stubs (en first)
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
├── integration_test/
├── pubspec.yaml
└── README.md
```

---

## Prerequisites

- **Flutter SDK** ≥ 3.24 (stable channel) — verify with `flutter --version`
- **Dart** ≥ 3.5 (bundled with Flutter)
- **Android Studio** Ladybug (2024.2) or newer with the Flutter & Dart plugins
- **JDK 17** (required by current Android Gradle Plugin)
- **Android SDK** Platform 34 + Build-Tools 34.x, plus an emulator or a physical device running Android 8.0 (API 26) or higher
- A configured **Firebase project** with:
  - Android app registered against this app's `applicationId`
  - `google-services.json` downloaded into `android/app/`
  - Cloud Messaging enabled
- Network access to the OrderSync Laravel API and realtime endpoints

Run `flutter doctor` and resolve all reported issues before continuing.

---

## Setup & Installation

```bash
# 1. Clone the parent repository, then enter the Flutter project
cd minigrocery_androidapp

# 2. Fetch packages
flutter pub get

# 3. Generate Riverpod / Retrofit / Hive / JSON code
dart run build_runner build --delete-conflicting-outputs

# 4. Place google-services.json
#    -> android/app/google-services.json   (do NOT commit this file)

# 5. Sanity-check the toolchain
flutter doctor -v
```

---

## Running the App

The app reads its environment from `--dart-define` flags. The recommended pattern is to keep flag files per environment outside source control and pass them via `--dart-define-from-file`.

### Debug

```bash
flutter run \
  --dart-define=ENV=dev \
  --dart-define=API_BASE_URL=https://dev-api.ordersync.local/api/v1 \
  --dart-define=WS_BASE_URL=wss://dev-api.ordersync.local/ws \
  --dart-define=FCM_SENDER_ID=000000000000
```

### Release (on-device smoke test)

```bash
flutter run --release \
  --dart-define=ENV=prod \
  --dart-define=API_BASE_URL=https://api.ordersync.example/api/v1 \
  --dart-define=WS_BASE_URL=wss://api.ordersync.example/ws \
  --dart-define=FCM_SENDER_ID=000000000000
```

---

## Environment Configuration

| Variable | Required | Example | Description |
| --- | --- | --- | --- |
| `ENV` | yes | `dev` / `staging` / `prod` | Selects logging verbosity and feature flags |
| `API_BASE_URL` | yes | `https://api.example.com/api/v1` | Base URL for REST endpoints |
| `WS_BASE_URL` | yes | `wss://api.example.com/ws` | STOMP/WebSocket endpoint for chat |
| `FCM_SENDER_ID` | yes | `123456789012` | Firebase Cloud Messaging sender ID |
| `ENABLE_HTTP_LOGS` | no | `true` | Enables Dio request/response logging in non-prod |
| `AI_SUPPORT_ENABLED` | no | `false` | Shows AI-assisted support when configured by the platform |
| `PAYMENT_PROOF_MAX_MB` | no | `8` | Client-side upload size limit; backend validation remains authoritative |

Values are read in `lib/core/config/env.dart` via `String.fromEnvironment` / `bool.fromEnvironment`.

---

## Build & Release (Android)

### APK (sideload / QA distribution)

```bash
flutter build apk --release \
  --dart-define-from-file=env/prod.json
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

### App Bundle (Play Store)

```bash
flutter build appbundle --release \
  --dart-define-from-file=env/prod.json
```
Output: `build/app/outputs/bundle/release/app-release.aab`

### Signing

1. Generate an upload keystore (`keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`).
2. Store credentials in `android/key.properties` (gitignored).
3. Reference them from `android/app/build.gradle.kts` per the [Flutter Android signing guide](https://docs.flutter.dev/deployment/android#signing-the-app).

### ProGuard / R8

Enable shrinking and obfuscation for release builds in `android/app/build.gradle.kts`. Add keep rules for `firebase_messaging`, `stomp_dart_client`, and any reflective JSON models.

---

## Testing Approach

| Tier | Tooling | Scope |
| --- | --- | --- |
| Unit | `flutter_test`, `mocktail` | Pure Dart: use cases, repositories with mocked data sources, mappers, validators |
| Widget | `flutter_test` | Screens with overridden Riverpod providers; golden tests for key widgets (catalog tile, order status chip) |
| Integration | `integration_test` | End-to-end tenant flow: login → select business → browse → cart → checkout → payment proof → order detail |

Commands:

```bash
flutter test                                          # unit + widget
flutter test integration_test/app_test.dart -d <id>   # integration
flutter test --coverage                               # coverage to coverage/lcov.info
```

Coverage target for MVP: **70%** on `lib/features/**/domain/` and `lib/features/**/data/`.

---

## Contribution & Branching

- **Default branch**: `main` (protected; release-ready only)
- **Integration branch**: `develop`
- **Feature branches**: `feature/<short-slug>` cut from `develop`
- **Fix branches**: `fix/<short-slug>` cut from `develop` (or `main` for hotfixes)
- **Pull requests**: target `develop`; require 1 reviewer, green CI, and all checkboxes in the linked `task.md` entry ticked
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`)
- **Code style**: `dart format .` and `flutter analyze` must pass before pushing

---

## License

TBD — license file to be added before public release. Until then, all rights reserved by the project owner.
