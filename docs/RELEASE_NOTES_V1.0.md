# OrderSync v1.0 Release Notes

Release status: implementation candidate; not deployed.

## Product capabilities

- Multi-tenant Laravel/PostgreSQL API with server-side role, membership, entitlement, and tenant enforcement.
- Super Admin business approval, suspension/reactivation, plans, subscriptions, billing records, payment review, users, and platform metrics.
- Business catalog, product images, inventory controls, stock history, low-stock alerts, transactional POS, receipts, pickup-order fulfillment, messaging, notifications, and reports.
- Customer Flutter experience and responsive installable web storefront for catalog browsing, local carts, pickup ordering, order status, manual GCash/Maya proof submission, support, and human handoff.
- Provider-neutral local-grounded AI support using tenant FAQs, announcements, products, stock, and customer-owned orders without an external model account.
- CSV/PDF reporting, PWA offline-safe shell, public catalog cache, scoped drafts, and explicit server-confirmed writes.

## Security and release hardening

- API route invariants guard the documented public surface, tenant middleware, and Super Admin platform routes.
- Laravel and the production web-server example set CSP, framing, content-type, referrer, and browser-permission policies.
- Shared accessible loading, empty, error, toast, route-failure, and connectivity feedback is available across the core web workflows.
- CI definitions cover the isolated PostgreSQL Laravel suite, React quality/build/browser suites, and Flutter quality/tests.
- The release runbook defines preflight, backup, restore drill, migration, smoke verification, and rollback controls.

## Data and upgrade notes

- PostgreSQL is the only supported database. Apply additive migrations with `php artisan migrate --force` after reviewing the target and taking matched database/file backups.
- Do not use `migrate:fresh` outside the isolated `ordersync_test` database.
- Existing application storage must move with the database because product images and private payment proofs are file-backed in v1.0.
- Update the web application and `/sw.js` atomically so installed clients receive the matching versioned shell.

## Known limitations

- GCash/Maya and other non-cash methods are manually recorded or reviewed; OrderSync does not claim wallet-provider confirmation.
- Customer ordering is pickup-only. Returns, refunds, completed-sale corrections, and automatic restock are not implemented.
- Notifications are foreground polling without external push delivery.
- AI support is deterministic/local-grounded rather than a network-backed generative model.
- PWA offline access excludes private orders, payments, and conversation histories; offline writes are not queued.
- Production object storage, malware scanning, infrastructure provisioning, DNS/TLS, deployment, monitoring accounts, and disaster-recovery targets require separate decisions and approval.
