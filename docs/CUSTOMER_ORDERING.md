# Customer Storefront and Ordering

Phase 6 makes Laravel and PostgreSQL authoritative for customer pickup orders. React provides a public storefront directory plus customer ordering, while Flutter uses the same catalog and order contracts. Static customer catalog, cart, checkout, and order data are no longer used by those shopping flows.

## Storefront eligibility and catalog

A public storefront is visible only when its business is Active and its current subscription is effectively Active or Grace with `customer_ordering_enabled`. Public responses contain the business identity, pickup fulfillment method, active categories, active products, selling prices, current availability, and public image URLs. Cost prices and other business-only inventory data are never exposed.

All customer order records, lines, and status events carry a `business_id`. Customer APIs additionally filter by the authenticated customer ID. Business order APIs are filtered by the business bound to the access token; route model identifiers from another tenant return not found.

## API contracts

All routes use the `/api/v1` prefix.

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /storefronts` | Public | List businesses currently eligible for customer ordering |
| `GET /storefronts/{slug}` | Public | Read one tenant-branded catalog and current availability |
| `GET /customer/orders` | Customer | List only the signed-in customer's orders in the token-bound tenant |
| `POST /customer/orders` | Customer | Place a server-priced pickup order |
| `GET /customer/orders/{id}` | Customer | Read one owned order and its status history |
| `POST /customer/orders/{id}/cancel` | Customer | Cancel an owned order while it is still Pending |
| `GET /orders` | Business Owner, Staff, Cashier | List tenant customer orders with filters |
| `GET /orders/{id}` | Business Owner, Staff, Cashier | Read one tenant order |
| `POST /orders/{id}/transition` | Business Owner, Staff, Cashier | Apply one legal pickup-workflow transition |

Customer and business order routes require an effective subscription with `customer_ordering_enabled`.

## Placement, pricing, and idempotency

`POST /customer/orders` requires an `Idempotency-Key` header. The key is scoped to the business and customer. An identical retry returns the existing order without creating another record; reuse with a different normalized item payload is rejected.

Laravel ignores client display values and reloads active tenant products, names, SKUs, prices, and current stock. It stores immutable line snapshots and calculates totals in integer minor units. Placement verifies current availability but does not reserve or deduct stock. This is intentional: availability can change before the business accepts the order.

## Confirmation and status workflow

The approved pickup workflow is:

`PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → COMPLETED`

A business may instead move `PENDING → REJECTED`; a rejection reason is required. The customer may move only an owned `PENDING` order to `CANCELLED`. Confirmed orders cannot be customer-cancelled in Phase 6 because refund and restock behavior has not been approved.

The first confirmation locks the order, products, and stock rows in a PostgreSQL transaction. It rechecks active products and sufficient stock, deducts each line, increments stock versions, writes one `ORDER_CONFIRMED` movement per line, synchronizes reorder alerts, appends status history, and records an audit event. Any failing line rolls back the complete confirmation. Concurrent confirmation attempts serialize on the order row, so only one can deduct stock.

## Client behavior

The React `/shop` directory and `/shop/{slug}` storefront use real Laravel APIs in normal development. Its `sessionStorage` cart is scoped to the storefront slug, clears on tenant switch or logout, retains one idempotency key while a failed request is retried, and clears only after confirmed placement.

Flutter now loads the authenticated customer's real tenant catalog and order history, uses one shared cart with stock caps, places pickup orders with a stable retry key, retains the cart after errors, shows all seven statuses and history, and exposes cancellation only for Pending orders. Catalog, order history, and cart state are cleared at the authentication or tenant boundary. Persistence across a cold app restart remains deferred because no new storage dependency was approved.

## Recorded payment integration

Phase 7 adds business-managed GCash/Maya instructions, private proof storage, manual verification, payment history, retention, and related audit records. An order with a submitted payment cannot be confirmed until that payment is manually verified; orders without a payment record still support pay-at-pickup. See [`RECORDED_PAYMENTS.md`](RECORDED_PAYMENTS.md).
