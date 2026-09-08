# OrderSync Local Development Setup

This document defines the repeatable Phase 1 development baseline. PostgreSQL is the only supported application and test database. SQLite must not be used as an automatic fallback.

## Toolchain

| Tool | Baseline |
| --- | --- |
| PHP | 8.3 |
| Composer | 2.8 |
| PostgreSQL | 17 |
| Node.js | 22 |
| npm | 10 |
| Flutter | 3.32.4 stable |
| Dart | 3.8.1 |
| Java | 17 for Android builds |

The initial Windows workstation uses Laragon-managed PostgreSQL. CI runs an isolated PostgreSQL service and does not depend on Laragon.

## PHP and PostgreSQL

Enable both bundled PHP extensions in the active `php.ini`:

```ini
extension=pdo_pgsql
extension=pgsql
```

The local baseline uses two non-superuser login roles and separate databases:

| Purpose | Database | Role |
| --- | --- | --- |
| Development | `ordersync` | `ordersync_app` |
| Automated tests | `ordersync_test` | `ordersync_test` |

The Laragon cluster currently permits trusted loopback connections, so the local templates leave `DB_PASSWORD` empty. Hosted, shared, staging, production, and CI environments must use managed secrets and password authentication.

Laravel forces PostgreSQL sessions to UTC with `DB_TIMEZONE=+00:00`; business-facing timezones remain explicit data, beginning with `Asia/Manila` for the pilot tenant.

## Laravel setup

1. Copy `.env.example` to `.env` if `.env` does not already exist.
2. Set local database credentials without committing them.
3. Run `composer install`.
4. Run `php artisan key:generate` for a new environment.
5. Run `php artisan migrate`.
6. Verify `GET /api/v1/health` returns database status `ok`.

For tests, create the dedicated test environment once, generate its local application key, and confirm that it names `ordersync_test` before using any destructive migration command.

```powershell
Copy-Item .env.testing.example .env.testing
php artisan key:generate --env=testing
# Open .env.testing and verify APP_ENV=testing and DB_DATABASE=ordersync_test.
php artisan migrate:fresh --env=testing --force
php artisan test
```

If `.env.testing` already exists, preserve it instead of overwriting it. Never point `migrate:fresh` at `ordersync`, staging, or production.

### Optional local Phase 2 identities

To exercise authentication locally, set a unique local value of at least 12 characters in the untracked `.env` file, then seed:

```dotenv
ORDERSYNC_DEV_SEED_PASSWORD=choose-a-local-password
```

```powershell
php artisan db:seed
```

This creates local-only owner, cashier, customer, and Super Admin identities under `@ordersync.local`. The seeder refuses to create these identities in production and does nothing when the password is missing or too short.

## React web setup

```powershell
Set-Location web
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

MSW remains enabled by default for the existing prototype. Turning it off will not expose business APIs until later phases implement them in Laravel.

Authentication bypasses MSW by default and is proxied to Laravel through `VITE_API_PROXY_TARGET`. Set `VITE_USE_MOCK_AUTH=true` only when deliberately running the legacy mock authentication tests or demo.

## Flutter setup

```powershell
Set-Location minigrocery_androidapp
flutter pub get
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
```

Android release builds additionally require JDK 17. Firebase configuration and signing material are intentionally deferred and must never be committed.

The Phase 2 Android login uses the real mobile auth contract. Override its development API URL when necessary:

```powershell
flutter run --dart-define=ORDERSYNC_API_BASE_URL=http://10.0.2.2/minigrocery/public/api/v1
```

The debug Android manifest permits local HTTP traffic for emulator development only. Release traffic retains Android's secure default and must use HTTPS. Phase 2 keeps tokens in memory; encrypted device persistence requires a separately approved dependency in a later client-hardening phase.

## Health contract

`GET /api/v1/health` returns only service and database availability. It must not include database names, hosts, credentials, stack traces, or exception messages.

## Secret handling

- Keep `.env`, `.env.testing`, Firebase files, signing keys, tokens, and payment proofs out of Git.
- Put placeholders—not real credentials—in example files.
- Store CI values in the CI provider's encrypted secret facility when secrets become necessary.
- Do not log authorization headers, proof URLs, passwords, or provider keys.
