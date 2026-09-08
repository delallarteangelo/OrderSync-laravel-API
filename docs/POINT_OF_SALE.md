# Point of Sale

Phase 5 makes Laravel and PostgreSQL authoritative for tenant POS checkout, completed-sale history, stock deduction, and receipt data. The React POS uses the real API in normal development; its cart remains a browser-session draft until the server confirms a sale.

## Tenant data model

Every POS record carries a `business_id`. A completed `sale` stores tenant-scoped sale and receipt numbers, cashier and business snapshots, integer-minor-unit totals, payment details, a request fingerprint, and an idempotency key. `sale_lines` preserve the SKU, product name, unit price, quantity, discount, and total used at checkout so later catalog edits do not change historical receipts.

- Sale, receipt, and idempotency identifiers are unique within one business.
- Completed sales and sale lines are append-only through the application model contract.
- PostgreSQL constraints enforce completed status, valid payment methods, internally consistent totals, and payment-shape rules.
- Product names, SKUs, and prices are loaded from PostgreSQL during finalization. Client-supplied display or price values are never trusted.
- Phase 5 applies a zero tax rate because tenant tax configuration has not yet been approved or implemented.

## Roles and entitlements

An effective Active or Grace subscription with `pos_enabled` is required. Business Owners, Staff, and Cashiers can complete sales and read their tenant's history. Only a Business Owner can apply a line discount. Laravel middleware, tenant filters, and the transaction service are authoritative; client controls are supplementary.

## API contracts

All routes use the `/api/v1` prefix and require a tenant-bound bearer token.

| Method and path | Purpose |
| --- | --- |
| `GET /pos/sales` | List completed tenant sales with pagination and optional payment, cashier, date, or text filters |
| `POST /pos/sales` | Finalize a server-priced sale and deduct stock atomically |
| `GET /pos/sales/{id}` | Read one tenant sale and its receipt lines |

`POST /pos/sales` requires an `Idempotency-Key` header. Repeating the same normalized request with the same key returns the original sale and `Idempotency-Replayed: true`; reusing the key for a different request is rejected. The key is scoped to the authenticated business.

## Transaction and stock behavior

Finalization takes a PostgreSQL transaction-scoped advisory lock for the tenant and idempotency key. It then locks products and stock rows in sorted product order, verifies that every product is active and has sufficient stock, writes one `POS_SALE` movement per line, increments stock versions, synchronizes reorder alerts, creates the sale and snapshots, and records `pos.sale_completed` in the audit log. Any invalid line, excessive discount, insufficient tender, or insufficient stock rolls back the entire checkout.

## Payment records

Cash checkout requires tender covering the server-calculated total and stores the resulting change. GCash, Maya, card, and other methods require a recorded reference and store neither cash tender nor change.

These non-cash entries are cashier-recorded references only. They do not contact or confirm with GCash, Maya, a card processor, or any payment provider. Proof upload and manual verification remain assigned to Phase 7.

## React integration

The cart draft uses `sessionStorage`, so it survives a refresh in the same browser tab but is not shared across tabs or devices. The persisted business identifier prevents a draft from crossing a tenant switch, and logout clears it. Checkout keeps one generated idempotency key while an uncertain request is retried and clears the cart only after the API confirms success. Product selection respects current client-visible stock, while the server performs the final concurrency-safe stock check.

The `/pos` workspace supports keyboard/barcode input, product search, camera scanning, owner-only line discounts, cash and recorded payment capture, and an 80 mm print view. `/pos/history` lists tenant sales and reopens printable receipt snapshots.
