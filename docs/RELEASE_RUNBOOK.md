# OrderSync v1.0 Release Runbook

This is a reviewable release procedure, not authorization to deploy. A target environment, credentials, DNS/TLS changes, external services, and production execution require separate approval.

## Release ownership and gates

Before scheduling a release, assign an operator, reviewer, rollback owner, and business approver. Record the target commit and maintenance window. The approver must also define recovery-point and recovery-time objectives; OrderSync does not invent those business commitments.

The release is blocked unless:

- CI passes Laravel formatting/tests, React formatting/lint/typecheck/tests/build/E2E, and Flutter format/analyze/tests.
- The target uses PostgreSQL and has a unique environment key, password-authenticated least-privilege database role, HTTPS, and protected secret storage.
- Storage for private payment proofs is backed up and is not directly web-accessible.
- The migration list and rollback impact have been reviewed against the target's current schema.
- A restore drill has succeeded in a disposable database and storage location.

## Pre-release inventory

1. Record the deployed commit, PHP/Node/PostgreSQL versions, migration list, configuration owner, and expected PWA cache version.
2. Put the application into a change window; stop background workers before schema changes if a future release adds them.
3. Confirm the database target explicitly. Never run `migrate:fresh`, seeders, or test commands against development, staging, or production data.
4. Capture row counts for tenant-owned tables and record the health endpoint result without storing secrets.

## Backup

Use environment-specific secret injection; do not paste credentials into scripts, tickets, or terminal history.

```powershell
$releaseStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
pg_dump --format=custom --no-owner --file="ordersync-$releaseStamp.dump" "$env:ORDERSYNC_DATABASE_URL"
```

Create a versioned backup of Laravel's private/public application storage using the target platform's approved snapshot or backup mechanism. Hash and inventory the database dump and file backup, encrypt them at rest, restrict access, and record retention/expiry. A database-only backup is incomplete because payment proofs and product images live in file storage in the current architecture.

## Restore drill

Restore only into an explicitly created disposable database and isolated storage path. Verify the resolved target name before the restore.

```powershell
createdb ordersync_restore_check
pg_restore --exit-on-error --no-owner --dbname=ordersync_restore_check .\ordersync-YYYYMMDD-HHMMSS.dump
```

Run schema inspection, row-count reconciliation, representative tenant-isolation reads, and file hash checks. Remove the disposable environment through the approved database administration process only after the drill is recorded.

## Release sequence

1. Fetch the reviewed commit and install locked PHP, Node, and Flutter dependencies in the build environment.
2. Build the React client and verify that no secret appears in built assets.
3. Enable maintenance mode if the migration review requires it.
4. Run `php artisan migrate --force`; never substitute `migrate:fresh`.
5. Clear and rebuild Laravel configuration/route caches using the target environment's secret injection.
6. Publish the immutable application build using the environment's approved atomic release mechanism.
7. Reload application processes, then disable maintenance mode.
8. Keep the prior application build and the matching pre-release database/storage backups until the release is accepted.

## Smoke verification

- `/api/v1/health` reports service and database availability without disclosing infrastructure details.
- Response headers include CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Referrer Policy, and Permissions Policy.
- Super Admin, Business Owner, Staff/Cashier, and Customer logins reach only their allowed surfaces.
- A tenant cannot read another tenant's catalog, inventory, order, payment proof, messages, reports, or AI context.
- Public storefront, cart, checkout confirmation, POS sale, payment-proof review, messaging/handoff, reports, PWA install/update, and offline safety work as documented.
- Database migration count, tenant row counts, audit records, and stored-file access reconcile with the pre-release inventory.

## Rollback decision

Stop the release if health, tenant isolation, authentication, migration reconciliation, file access, or server-confirmed writes fail. Disable traffic to the new build and preserve evidence.

Prefer an application rollback when the new schema is backward-compatible. Use `php artisan migrate:rollback --step=1 --force` only when the exact migration was reviewed as safely reversible and no new production data would be lost. Otherwise restore the matched database and file backups into an isolated replacement environment, verify them, and switch traffic through the approved infrastructure process. Never improvise a destructive in-place database reset.

## Acceptance record

Record the commit, artifacts, migration batch, backup identifiers and hashes, restore-drill evidence, smoke-test results, Lighthouse results, approvers, timestamps, incidents, and final accept/rollback decision. Remove temporary credentials and expire release-only access afterward.
