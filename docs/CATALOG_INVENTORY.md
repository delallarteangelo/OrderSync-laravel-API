# Catalog and Inventory

Phase 4 makes PostgreSQL authoritative for the tenant catalog and inventory used by the React business workspace. Laravel owns validation, authorization, stock transactions, movement history, images, and low-stock state.

## Tenant data model

Every catalog and inventory table carries a `business_id`: `categories`, `products`, `product_images`, `inventory_stocks`, `inventory_movements`, and `reorder_alerts`. API queries always derive that business from the authenticated access token; route identifiers from another tenant return `404` and cannot override the token context.

- Categories are unique by case-insensitive name within one business.
- Product SKU and non-null barcode are unique within one business. The same identifiers may be used by another business.
- Each product has exactly one stock row and one current reorder-alert row at most.
- Prices and costs are stored as integer minor units and exposed as decimal PHP values.
- Stock cannot be negative. PostgreSQL check constraints provide a final safeguard.
- Inventory movements are append-only and store the delta, before/after quantities, reason, actor, note, supplier reference, and timestamp.

## Roles and entitlements

An effective Active or Grace subscription is required. Catalog routes require `catalog_enabled`; inventory routes require `inventory_enabled`.

| Capability | Business Owner | Staff | Cashier |
| --- | --- | --- | --- |
| Read catalog, stock, alerts, and movement history | Yes | Yes | Yes |
| Create/update/deactivate products and categories | Yes | Yes | No |
| Upload product images | Yes | Yes | No |
| Adjust or restock inventory | Yes | Yes | No |

Client route guards and hidden controls improve the interface, but Laravel middleware and tenant filters are authoritative.

## API contracts

All routes use the `/api/v1` prefix and require a tenant-bound bearer token.

| Method and path | Purpose |
| --- | --- |
| `GET /categories` | List tenant categories with product counts |
| `POST /categories` | Create a category |
| `PUT /categories/{id}` | Rename or activate/deactivate a category |
| `DELETE /categories/{id}` | Delete an unused category; returns `409` while products reference it |
| `GET /products` | List/search/filter tenant products; returns `items` and pagination `meta` |
| `GET /products/by-barcode/{code}` | Resolve a barcode or normalized SKU |
| `GET /products/{id}` | Read one tenant product |
| `POST /products` | Create a product and its initial stock row |
| `PUT /products/{id}` | Update product metadata; existing stock is changed only through inventory routes |
| `POST /products/{id}/deactivate` | Hide a product from active use and resolve its open alert |
| `POST /products/{id}/reactivate` | Reactivate a product and recalculate alert state |
| `POST /products/{id}/image` | Upload a primary JPEG, PNG, or WebP image up to 4 MB |
| `GET /inventory` | List current tenant stock with product data |
| `GET /inventory/low-stock` | List persisted open reorder alerts |
| `GET /inventory/movements` | Filter movement history by product, reason, and date range |
| `POST /inventory/adjust` | Apply a reason-coded manual stock delta with a required note |
| `POST /inventory/restock` | Atomically apply up to 100 unique restock lines |

Manual adjustments accept only `ADJUSTMENT`. `RESTOCK` is assigned by the restock endpoint, and `POS_SALE` is now assigned only by the Phase 5 checkout transaction. `ORDER_CONFIRMED` remains reserved for the later ordering workflow.

## Transaction and alert behavior

Stock mutations lock the affected stock row with `SELECT ... FOR UPDATE`, calculate the new quantity, reject a negative result, increment a version counter, append the movement, synchronize the reorder alert, and write an audit entry in one PostgreSQL transaction. Multi-line restocks sort product identifiers before locking to reduce deadlock risk and roll back every line if any line is invalid.

An open reorder alert exists when an active product's quantity is less than or equal to its threshold. It resolves when stock rises above the threshold or the product is deactivated, and reopens with a new opened timestamp when the condition returns. External notification delivery is deferred to Phase 8.

## Product images

Development images use Laravel's `public` disk under `storage/app/public/product-images/{business_id}`. Run `php artisan storage:link` once so `/storage/...` URLs are available locally. Replacing a primary image commits the new database record before removing the former file. Private payment-proof storage is a separate Phase 7 concern and must not reuse this public disk.

## React integration

Normal development bypasses MSW for authentication, SaaS administration, catalog, and inventory; only future-phase business modules remain mocked. Catalog and inventory TanStack Query keys include the authenticated business ID, preventing cached data from being reused after a tenant switch. Setting `VITE_USE_MOCK_AUTH=true` deliberately restores the complete mock demo and test surface.
