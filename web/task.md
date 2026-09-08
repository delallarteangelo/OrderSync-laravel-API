# Task Tracker — OrderSync SaaS Web Platform

Granular, checkbox-driven tracker that mirrors `implementation_plan.md` 1:1. Update statuses as work progresses.

> Repository delivery status is tracked in [`../docs/BUILD_STATUS.md`](../docs/BUILD_STATUS.md). The checklist below remains the client-specific implementation tracker; Phase 1 repository-foundation work does not imply completion of later SaaS modules.

## Repository delivery checkpoint

- [x] 2026-09-07 — Phase 1 engineering foundation verified: typed environment flags, clean typecheck/tests/build, PostgreSQL-backed Laravel health contract, and CI baseline. See [`../docs/BUILD_STATUS.md`](../docs/BUILD_STATUS.md).
- [x] 2026-09-08 — Phase 2 tenant/auth boundary verified: real Laravel login/refresh/logout, complete role vocabulary, business-bound session context, guarded workspace/platform navigation, multi-business selection, and role tests. Later business APIs remain mocked. See [`../docs/AUTH_TENANCY.md`](../docs/AUTH_TENANCY.md).
- [x] 2026-09-08 — Phase 3 SaaS administration verified: business application/approval, suspension/reactivation, plan entitlements, subscription lifecycle, internal billing, platform metrics, account activation, and owner subscription visibility use real Laravel APIs. See [`../docs/SAAS_ADMINISTRATION.md`](../docs/SAAS_ADMINISTRATION.md).
- [x] 2026-09-08 — Phase 4 catalog and inventory verified: tenant products/categories/images, transactional stock, immutable movements, restocking, low-stock alerts, role-aware controls, and tenant-scoped query caches use real Laravel APIs. See [`../docs/CATALOG_INVENTORY.md`](../docs/CATALOG_INVENTORY.md).
- [x] 2026-09-08 — Phase 5 transactional POS verified: tenant sales and receipt snapshots, server pricing, idempotent checkout, atomic stock deduction, recorded payment references, Cashier access, sales history, and tenant-scoped caches use real Laravel APIs. See [`../docs/POINT_OF_SALE.md`](../docs/POINT_OF_SALE.md).

## Legend

| Marker | Meaning |
| --- | --- |
| ☐ | To do (use `- [ ]`) |
| 🔄 | In progress (use `- [~]` in comments, or annotate with `🔄`) |
| ✅ | Done (use `- [x]`) |
| ⛔ | Blocked (annotate with `⛔` and link the blocker) |

---

## Phase 1 — Project scaffold, theming, routing, env, app shell

- [ ] Initialize Vite + React + TypeScript project under `web/` (`npm create vite@latest -- --template react-ts`)
- [ ] Add dependencies: `react-router-dom`, `@tanstack/react-query`, `@tanstack/react-table`, `zustand`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `lucide-react`, `recharts`, `@stomp/stompjs`, `papaparse`, `@react-pdf/renderer`, `@zxing/browser`
- [ ] Add dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`, `eslint`, `prettier`, `eslint-config-prettier`, `eslint-plugin-react-hooks`, `tailwindcss`, `postcss`, `autoprefixer`
- [ ] Configure Tailwind CSS (`tailwind.config.ts`, `postcss.config.cjs`, `src/styles/globals.css`)
- [ ] Initialize shadcn/ui (`npx shadcn@latest init`) and install primitives: `button`, `input`, `dialog`, `dropdown-menu`, `table`, `select`, `toast`, `tooltip`, `tabs`, `badge`, `card`
- [ ] Create `src/shared/config/env.ts` with typed API, WebSocket, PWA, AI-support, and low-stock feature flags
- [ ] Author `.env.example` mirroring the env table in `README.md`
- [ ] Create `src/app/layout/{AppShell,Sidebar,Topbar}.tsx`
- [ ] Create role-aware routes for Super Admin, business workspace/POS, and customer storefront/PWA surfaces
- [ ] Create `src/app/providers/{QueryProvider,AuthProvider,ToastProvider}.tsx` and compose in `App.tsx`
- [ ] Configure ESLint + Prettier; add `npm run lint`, `npm run format`, `npm run test` scripts
- [ ] Verify `npm run dev`, `npm run build`, `npm run preview` all succeed

---

## Phase 2 — Authentication, tenancy & role-based access

- [ ] Create `src/shared/types/auth.ts` with `User`, `BusinessMembership`, `Role`, and `AuthSession` zod schemas for `SUPER_ADMIN`, `BUSINESS_OWNER`, `STAFF`/`CASHIER`, and `CUSTOMER`
- [x] Create `src/shared/api/axios.ts` (base instance with `withCredentials: true`, timeout, env-driven baseURL)
- [x] Create `src/shared/api/auth.ts` with `login`, `logout`, `me`, `refresh`
- [x] Implement `src/shared/api/interceptors/authInterceptor.ts` (attach bearer from `AuthStore`)
- [x] Implement `src/shared/api/interceptors/refreshInterceptor.ts` with a single-flight mutex and request queue
- [x] Implement `src/shared/api/interceptors/errorInterceptor.ts` normalizing to `ApiError`
- [x] Create `src/app/providers/AuthProvider.tsx` (Zustand store: `accessToken`, `user`, `bootstrap()`, `setSession()`, `clear()`)
- [x] Bootstrap session on cold load via `POST /auth/refresh` (cookie-driven)
- [x] Create `src/app/router/RequireAuth.tsx` and `RequireRole.tsx`
- [x] Create `src/shared/hooks/useRole.ts`
- [ ] Create tenant-context and subscription-entitlement guards; include `businessId` in every tenant query key and request
- [x] Build `src/features/auth/pages/LoginPage.tsx` (react-hook-form + zod, server error mapping)
- [ ] Route each role to its authorized platform, business, or storefront experience and deny cross-tenant access
- [x] Implement logout (`POST /auth/logout`, clear store, navigate to `/login`)
- [ ] Add idle-timeout hook (default 30 minutes, configurable via settings)
- [x] Unit test the refresh mutex behavior (only one refresh fires under N parallel 401s)

---

## Phase 3 — Role-aware dashboards

- [ ] Create `src/features/dashboard/pages/DashboardPage.tsx`
- [ ] Build `KpiCard` shared component (label, value, delta, icon)
- [ ] Implement tenant dashboard metrics: sales, revenue, open orders, low stock, best sellers, slow movers, inventory, and customer trends
- [x] Implement Super Admin metrics: registered businesses, active subscriptions, platform revenue/transactions, users, and system health
- [ ] Build a 7-day sales line chart with Recharts
- [ ] Build a recent-orders table (links to order detail)
- [ ] Build a low-stock alerts panel for authorized business users
- [ ] Render role-aware variants for Super Admin, Business Owner, and Staff/Cashier
- [ ] Add skeleton loader for every widget
- [ ] Component tests verify each role's dashboard and prevent cross-tenant cache reuse

---

## Phase 4 — Catalog & category management

- [x] Create `src/shared/types/catalog.ts` (`Product`, `Category` zod schemas)
- [x] Create `src/shared/api/catalog.ts` (`listProducts`, `getProduct`, `createProduct`, `updateProduct`, `deactivateProduct`, `listCategories`, `createCategory`, `updateCategory`, `deleteCategory`)
- [x] Build shared `DataTable` component (`src/shared/components/DataTable.tsx`) with TanStack Table: sort, filter, paginate, column visibility, row actions
- [x] Build `features/catalog/pages/ProductListPage.tsx` (search, category filter, active filter)
- [x] Build `features/catalog/pages/ProductFormPage.tsx` (create + edit, image upload widget, barcode field, SKU uniqueness error mapping)
- [x] Build `features/catalog/pages/CategoryListPage.tsx` with inline create/edit/delete (guard delete when category in use)
- [x] Render write controls for Business Owner and policy-authorized Staff/Cashier users only
- [ ] Component test: product form surfaces server `fieldErrors` inline

---

## Phase 5 — Inventory management & movement logs

- [x] Create `src/shared/types/inventory.ts` (`InventoryMovement`, `StockAdjustment`, `RestockEntry`)
- [x] Create `src/shared/api/inventory.ts` (`listInventory`, `listMovements`, `adjustStock`, `submitRestock`, `listLowStock`)
- [x] Build `features/inventory/pages/InventoryListPage.tsx` with stock-level badges
- [ ] Build `features/inventory/pages/AdjustStockDialog.tsx` (reason code dropdown, delta input, required note for negative deltas)
- [x] Build `features/inventory/pages/RestockPage.tsx` with multi-line entry table
- [x] Build `features/inventory/pages/MovementLogPage.tsx` (date-range, product, reason filters; CSV export via `papaparse`)
- [x] Add tenant-scoped low-stock and reorder alerts for authorized business users
- [ ] Component test: negative adjustment requires a note before submission

---

## Phase 6 — POS module

- [x] Create `src/shared/types/pos.ts` (`CartLine`, `PosSale`, `PaymentMethod` zod schemas)
- [x] Create Zustand `posCartStore` with persistent local draft (sessionStorage)
- [x] Implement `src/shared/hooks/useBarcodeScanner.ts` (time-windowed character buffer; Enter terminator; configurable threshold)
- [x] Build webcam fallback using `@zxing/browser` behind a button toggle
- [x] Build `features/pos/pages/PosPage.tsx` (full-screen layout: scan input + product search left, cart right)
- [x] Build `features/pos/components/ScanInput.tsx` (auto-focused, debounce on manual search)
- [ ] Build `features/pos/components/CartPanel.tsx` (quantity steppers, line discount admin-gated, line remove, clear-all with confirmation)
- [x] Build `features/pos/components/PaymentDialog.tsx` (cash plus recorded GCash/Maya or other methods; cash computes change)
- [x] Implement `src/shared/api/pos.ts` (`finalizeSale`)
- [x] Atomically clear cart only on `finalizeSale` success
- [x] Build `features/pos/components/ReceiptView.tsx` (print-friendly stylesheet for 80mm thermal printer)
- [x] Implement `src/shared/hooks/usePrintReceipt.ts` (`window.print()` with print-only stylesheet)
- [ ] Wire keyboard shortcuts: focus scan input, edit qty, finalize sale, cancel sale
- [ ] E2E (Playwright): mocked scanner inputs → complete sale → receipt visible

---

## Phase 7 — Order management

- [ ] Create `src/shared/types/orders.ts` (`Order`, `OrderItem`, `OrderStatus`, `OrderStatusEvent` zod schemas)
- [ ] Create `src/shared/api/orders.ts` (`listOrders`, `getOrder`, `confirmOrder`, `rejectOrder`, `setStatus`, `cancelOrder`)
- [ ] Build `features/orders/components/StatusChip.tsx` rendering all seven statuses distinctly
- [ ] Build `features/orders/pages/OrderListPage.tsx` (filters: status, date range, customer; sortable columns)
- [ ] Build `features/orders/pages/OrderDetailPage.tsx` with status timeline and transition actions
- [ ] Encode legal transitions client-side; hide disallowed actions
- [ ] Surface backend stock-validation errors per offending line on confirmation
- [ ] Component test: cashier sees `Confirm` only when status is `PENDING`
- [ ] Component test: status timeline renders all `statusHistory` entries chronologically

---

## Phase 8 — Messaging & AI handoff foundation

- [ ] Create `src/shared/types/messaging.ts` (`ChatThread`, `Message`)
- [ ] Create `src/shared/api/messages.ts` (`listThreads`, `getMessages`, `sendMessage`, `markRead`)
- [ ] Implement `src/shared/ws/stompClient.ts` (connect with bearer in CONNECT headers, subscriptions registry, exponential backoff, heartbeats)
- [ ] Subscribe only to destinations authorized for the signed-in user and active business
- [ ] On inbound frames, invalidate the relevant TanStack Query keys
- [ ] Build `features/messaging/pages/ChatPage.tsx` (thread list left, thread view right)
- [ ] Implement optimistic message send + server-ack reconciliation
- [ ] Render unread badges on threads and on the sidebar nav item
- [ ] Render system messages (e.g. "Order confirmed") with distinct styling
- [ ] Pause subscriptions on `document.visibilitychange === 'hidden'` after 60s; resume on visible
- [ ] Add polling fallback behind a `VITE_USE_POLLING_CHAT` flag

---

## Phase 9 — Analytics, reports & exports

- [ ] Create `src/shared/types/reports.ts` (`SalesReportRow`, `OrdersReportRow`, `InventoryReportRow`)
- [ ] Extend `src/shared/api/reports.ts` (`getSalesReport`, `getOrdersReport`, `getInventoryReport` with `bucket: 'day' | 'week' | 'month'`)
- [ ] Build `features/reports/pages/SalesReportPage.tsx` (bar chart + table)
- [ ] Build `features/reports/pages/OrdersReportPage.tsx` (stacked-by-status bar chart + table)
- [ ] Build `features/reports/pages/InventoryReportPage.tsx` (on-hand snapshot + movement summary)
- [ ] Add revenue monitoring, best-selling products, slow-moving products, and customer purchase trends
- [ ] Build shared `DateRangePicker` and `BucketSelector` components
- [ ] Implement CSV export per report via `papaparse` (mirrors current filtered rows)
- [ ] Implement PDF export via `@react-pdf/renderer` (header, footer, pagination)
- [ ] Component test: changing bucket re-queries with the new param

---

## Phase 10 — Business users & settings

- [ ] Create `src/shared/types/users.ts` and `src/shared/types/settings.ts` zod schemas
- [ ] Create `src/shared/api/users.ts` (`listUsers`, `createUser`, `updateUser`, `deactivateUser`, `triggerPasswordReset`)
- [ ] Create `src/shared/api/settings.ts` (`getSettings`, `updateSettings`)
- [ ] Build `features/users/pages/UserListPage.tsx` (Business Owner-only, tenant status filter, role badge)
- [ ] Build `features/users/pages/UserFormPage.tsx` (create/edit Staff or Cashier; cannot change own role or deactivate self)
- [ ] Build `features/settings/pages/BusinessSettingsPage.tsx` (store profile, tax, currency, receipt header/footer, default low-stock threshold)
- [ ] Build self-service password change dialog accessible from `Topbar`
- [ ] Component test: self-deactivation button is disabled

---

## Phase 11 — Super Admin, business accounts & subscriptions

- [x] Build Super Admin dashboard for businesses, subscriptions, platform revenue/transactions, users, and system health
- [x] Create business registration review, approval, suspension, reactivation, and business-information screens
- [x] Create configurable Basic, Standard, and Premium plan management with feature/usage entitlements
- [x] Build subscription activation, renewal monitoring, grace-period, suspension, and reactivation workflows
- [x] Build billing history and subscription reports
- [ ] Add Super Admin user management: owners, password resets, suspension, activity viewer, and role management
- [x] Audit every platform administration and subscription change
- [ ] E2E: approve a business, activate a plan, suspend access, then reactivate without data loss

---

## Phase 12 — Recorded GCash/Maya payments

- [ ] Create `PaymentRecord` types for order and subscription purposes with pending, verified, and rejected states
- [ ] Build business-managed GCash/Maya QR instructions, reference-number entry, and proof-of-payment upload; do not call wallet APIs in MVP
- [ ] Validate proof file type/size and store it privately behind authorized access
- [ ] Build Staff/Business Owner order-payment verification queue and Super Admin subscription-payment queue
- [ ] Record verifier, timestamp, decision, reason, and immutable payment logs
- [ ] Generate digital receipts and expose tenant/customer payment history
- [ ] Detect duplicate reference numbers or identical proof uploads for manual review
- [ ] E2E: submit proof, verify it, and ensure the related order/subscription updates only after verification

---

## Phase 13 — AI chatbot & knowledge management

- [ ] Create a provider-neutral backend contract for OpenAI, Claude, or another configured provider
- [ ] Build tenant FAQ, business announcement, product, stock, and order-status retrieval tools
- [ ] Add customer AI-support thread with visible AI labeling and human handoff
- [ ] Authorize every AI tool call against the active business and customer's own order
- [ ] Build Super Admin knowledge-base, FAQ response, provider settings, rate limits, and usage analytics screens
- [ ] Add refusal/fallback rules, prompt-injection defenses, audit events, and cost/latency metrics
- [ ] Test that AI cannot retrieve another business's data or another customer's order

---

## Phase 14 — Progressive Web App

- [ ] Add web app manifest, OrderSync icons, theme colors, and install prompt
- [ ] Register a service worker with versioned update flow and cached application shell
- [ ] Make customer storefront, catalog, cart, checkout, payments, orders, and chat responsive on mobile browsers
- [ ] Cache read-only catalog data and preserve offline cart/message drafts
- [ ] Require server confirmation before showing order, stock, payment, or subscription writes as complete
- [ ] Run Lighthouse PWA, performance, accessibility, and offline checks

---

## Phase 15 — Polish, testing, hardening, release

- [ ] Add reusable `Skeleton`, `EmptyState`, `ErrorState` components and use them across all list/detail pages
- [ ] Wire global toast service via `ToastProvider`
- [ ] Add offline banner driven by `navigator.onLine` + custom heartbeat ping
- [ ] Accessibility audit: keyboard nav, ARIA labels, focus traps in dialogs, color contrast ≥ AA
- [ ] Extract English strings into `src/shared/i18n/en.ts` (single module, future i18n hook in place)
- [ ] Author Vitest suites for `src/shared/lib/`, `src/shared/api/interceptors/`, every feature's `api/` and `hooks/`
- [ ] Author Playwright E2E specs: role login, tenant isolation, POS sale, order confirmation, payment proof, subscription lifecycle, AI handoff, PWA installability, and reports
- [ ] Add CI workflow (GitHub Actions): install → lint → type-check → test → build → e2e (against `vite preview`)
- [ ] Configure strict Content-Security-Policy, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Add `docs/deploy/nginx.conf.example` with SPA fallback and security headers
- [ ] Verify `Lighthouse` on dashboard: Performance ≥ 85, Accessibility ≥ 95
- [ ] Draft v1.0 release notes

---

## Backlog / Nice-to-Have

- [ ] Customer loyalty / discount rules administration UI
- [ ] Scheduled promotions screen with effective windows and product targeting
- [ ] Bulk product import via CSV with row-level validation report
- [ ] Multi-store / multi-register support (store picker in topbar)
- [ ] Dark mode and density toggles
- [ ] Two-factor authentication for Super Admin and Business Owner accounts (TOTP)
- [ ] Cash drawer open/close shift workflow
- [ ] Returns / refunds workflow with reversal movements
- [ ] Saved POS carts (park / resume)
- [ ] Sales analytics with cohort / category drill-down
- [ ] Direct GCash/Maya API integration only after provider access, security review, and business-case approval

---

## Blocked / Waiting on Backend

- [ ] ⛔ Final API spec for auth, businesses, memberships, plans, subscriptions, entitlements, catalog, inventory, orders, POS, payments, proof uploads, threads, AI, reports, users, and settings
- [ ] ⛔ Refresh-token contract: cookie name, lifetime, rotation policy, revoke endpoint
- [ ] ⛔ Realtime endpoint, tenant destination naming, and authentication contract
- [ ] ⛔ Receipt-number format and uniqueness contract
- [ ] ⛔ Order-transition matrix per role (which statuses cashier vs admin may set)
- [ ] ⛔ Inventory adjustment reason-code enum from backend
- [ ] ⛔ Pagination contract (page/size vs cursor) for catalog, orders, movements, reports
- [ ] ⛔ Image hosting / CDN base URL for `Product` images
- [ ] ⛔ Reports endpoint contract (bucket parameter shape, response schema, PDF stream availability)
- [ ] ⛔ Subscription plan pricing, billing periods, grace periods, and entitlement matrix
- [ ] ⛔ Payment-proof retention, accepted formats/sizes, verification policy, and private storage design
- [ ] ⛔ AI provider evaluation criteria, budget, privacy/retention rules, and human-handoff service levels
- [ ] ⛔ PWA cache/version policy and final customer storefront URL strategy
