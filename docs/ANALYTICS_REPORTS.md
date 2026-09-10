# Analytics, Reports, and Exports

Phase 9 replaces the React reporting fixtures with tenant-scoped Laravel analytics calculated from PostgreSQL. It adds business dashboards, filtered sales/order/inventory reports, product and customer trends, and tenant-branded CSV/PDF exports. No database schema, external analytics service, scheduled job, or mobile-client change was introduced.

## Authoritative definitions

- **Realized sales and revenue** combine completed POS sales and customer orders whose status is `COMPLETED`. Pending or otherwise incomplete customer orders are excluded.
- **Gross revenue** is the sum of POS subtotals plus completed-order subtotals. **Discounts** are POS discounts; the current order workflow has no order-discount field. **Net revenue** is the sum of POS grand totals plus completed-order totals.
- **Sales count** is the number of realized POS sales plus completed customer orders.
- **Order volume** counts orders by `placed_at` and current status, independent of whether they have been completed.
- **Units sold and product revenue** combine POS lines with lines from completed customer orders.
- **Best sellers** are the ten active products with the highest units sold in the selected range. **Slow movers** are the ten active products with the lowest units sold, including zero-sale products.
- **Customer purchase trends** rank up to 25 customer snapshots by revenue from completed customer orders. POS sales are excluded because the POS model does not identify a customer.
- **Inventory status and valuation** are a current snapshot. Movement totals cover the selected date range. Retail and cost values are current on-hand quantity multiplied by the product's current price or cost.
- **Platform metrics** continue to use the Super Admin dashboard's authoritative business, user, subscription, and internal paid-billing records.

Money is stored and aggregated in integer minor units in PostgreSQL, then returned to clients as major-unit numbers.

## Dates and aggregation

All report dates are interpreted in the authenticated business's configured timezone, while database connections and stored timestamps remain UTC.

Sales and order reports accept `bucket=day|week|month`. Weeks start on Monday under PostgreSQL's ISO week behavior. Optional `from` and `to` values use `YYYY-MM-DD`, are inclusive business-local dates, and cannot span more than 732 days.

When dates are omitted, the defaults are:

| Bucket | Default range |
| --- | --- |
| Day | Today and the preceding 29 days |
| Week | Today and the preceding 83 days |
| Month | Today and the preceding 364 days |

Inventory and overview reports use the day-range default but do not bucket their output. The business dashboard always supplies a filled seven-day series, including zero-value days.

## API surface

All routes are under `/api/v1`.

| Route | Authorized role | Entitlement | Purpose |
| --- | --- | --- | --- |
| `GET /dashboard` | Business Owner, Staff, Cashier | Authenticated tenant workspace | Today's realized activity, seven-day sales, orders, low stock, recent movements, and the current user's POS sales |
| `GET /reports/sales` | Business Owner | `analytics_enabled` | Day/week/month sales and revenue aggregates |
| `GET /reports/orders` | Business Owner | `analytics_enabled` | Day/week/month order counts by status |
| `GET /reports/inventory` | Business Owner | `analytics_enabled` | Current on-hand status/value plus selected-range movement totals |
| `GET /reports/overview` | Business Owner | `analytics_enabled` | Best sellers, slow movers, and customer purchase trends |
| `GET /platform/dashboard` | Super Admin | Platform role | Existing platform/subscription metrics, including paid billing records |

Laravel's token-bound `currentBusiness` is authoritative. A client cannot select another business through a report parameter or header.

## Web behavior and exports

Normal web development now calls the Laravel dashboard and report endpoints; report mock handlers remain available only to automated tests. Dashboard and report query keys include the authenticated business ID so cached data cannot cross tenant switches.

The report screens provide date filters and relevant day/week/month aggregation controls. CSV and PDF files contain the currently returned filtered rows. CSV string cells beginning with spreadsheet formula prefixes are escaped. PDF headers and footers use the authenticated tenant's name and include pagination.

Exports are generated on demand in the browser. They are not persisted by Laravel, emailed, or scheduled, and they do not introduce a separate export permission or external storage service.

## Security and verification

- Server middleware enforces authentication, tenant binding, Business Owner report access, and the analytics entitlement.
- PostgreSQL queries always include the token-bound `business_id`; cross-tenant records are excluded before aggregation.
- Tests reconcile exact POS and completed-order totals, including a UTC event that crosses into the next business-local day.
- Tests cover status aggregation, movement totals, inventory valuation, product/customer trends, role denial, entitlement denial, invalid ranges, and tenant-safe query keys.
- The isolated `ordersync_test` database is rebuilt for backend tests. The `ordersync` development database remains migrated and empty except for migration-owned plan/entitlement reference rows.

## Explicit deferrals

Phase 9 does not include scheduled or emailed reports, persisted export files, custom report builders, warehouse/ETL infrastructure, multi-currency conversion, cohort/category drill-down, returns/refund corrections, or Android reporting screens. Those changes require a later approved phase.
