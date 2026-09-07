# OrderSync — SaaS Web Platform

The OrderSync web application is the browser-based control center for a startup Software-as-a-Service platform serving micro and small businesses. It combines platform administration, business operations, point of sale, analytics, subscription management, and an installable customer-ordering Progressive Web App (PWA).

Tonette's Minimart is the initial pilot and demo tenant. It must be represented as ordinary business data; platform branding, authorization, routes, reports, and domain models must remain reusable by other businesses.

---

## Scope of This System

This client serves three web experiences:

- **Super Admin console:** manage business registrations, accounts, subscription plans and renewals, billing/payment verification, platform users, AI configuration, reports, and system health.
- **Business workspace:** business owners and staff/cashiers manage their own tenant's products, categories, inventory, POS, orders, customers, messages, payments, reports, users, and settings.
- **Customer ordering PWA:** customers select a business storefront, browse its catalog, build a cart, place and track orders, record GCash/Maya payments with proof, and use AI-assisted support.

The Flutter customer app in `minigrocery_androidapp/` is a native companion client that uses the same tenant-aware platform API.

The backend is the source of truth. Stock-affecting operations, order transitions, payment verification, subscription changes, and privileged administrative actions are validated server-side and produce audit records.

### How it fits into the larger system

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│ Customer App                 │        │ OrderSync Web + PWA          │
│ Flutter · Android            │        │ React · Vite · TypeScript   │
└──────────────┬───────────────┘        └──────────────┬───────────────┘
               │ REST + WebSocket + push              │ REST + WebSocket
               └───────────────┬───────────────────────┘
                               ▼
                  ┌──────────────────────────┐
                  │ Multi-tenant Laravel API │
                  │ Data · queue · audit log │
                  └──────────────────────────┘
```

---

## Key Features

### Must-Have (MVP)

**Platform foundation**
- Multi-tenant business accounts with strict `businessId` scoping and server-side authorization
- Four roles: `SUPER_ADMIN`, `BUSINESS_OWNER`, `STAFF`/`CASHIER`, and `CUSTOMER`
- Business registration review, approval, suspension, and reactivation
- Configurable Basic, Standard, and Premium plans with subscriptions, renewals, entitlements, and billing history
- Super Admin dashboard: registered businesses, active subscriptions, monthly platform revenue, platform transactions, total users, and system health

**Business Owner + Staff/Cashier**
- Role-aware dashboard with daily, weekly, and monthly sales, revenue, best sellers, slow movers, inventory reports, and customer purchase trends
- In-app messaging with customers (general + order-specific threads)
- Order management list with status pipeline (`PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → COMPLETED`, plus `REJECTED` / `CANCELLED`)
- Order confirmation / rejection / cancellation (within role-allowed transitions)
- POS module: scan or search items, build sale, take payment, finalize, deduct stock, generate receipt
- Barcode scanning via USB scanners (keyboard wedge) and webcam fallback
- Receipt generation and printable receipt view
- Inventory view with on-hand stock, low-stock indicators, and movement log
- Audit-friendly inventory adjustment with required reason
- Restocking workflow for incoming stock
- Per-user transaction and action history
- Product CRUD (create, edit, deactivate)
- Category CRUD
- Business user management (create staff/cashier accounts, deactivate, reset password)
- Business settings (store profile, tax, receipt header/footer, low-stock threshold)
- Export reports to CSV and PDF

**Customer ordering + payments**
- Business-scoped product catalog, cart, checkout, order history, and order tracking
- GCash and Maya as recorded payment methods: business-managed QR instructions, reference details, and screenshot/receipt upload
- Manual payment verification by authorized staff or Super Admin; no direct GCash/Maya API dependency in MVP
- Digital receipts and immutable payment history

**AI-assisted communication**
- Tenant-grounded product, stock-availability, order-status, FAQ, and announcement answers
- Human handoff and clear AI labeling
- Super Admin controls for knowledge bases, FAQ responses, provider settings, and usage analytics
- Provider-neutral adapter so OpenAI, Claude, or another provider can be chosen using measured cost and implementation fit

### Should-Have
- Global product search and filters (category, active status, stock level)
- Pagination, sorting, and column toggles on data tables
- Skeleton loaders and consistent empty/error states
- Low-stock alerts panel surfaced for authorized business users
- Keyboard shortcuts for POS (scan focus, quantity, discount, finalize)
- Offline-tolerant POS draft (locally drafted cart survives reload; finalization always requires connectivity)
- Realtime updates for new orders and chat messages (STOMP/WebSocket)
- Browser push notifications for new orders and messages (best-effort)
- Installable PWA manifest, service worker, responsive storefront, cached application shell, and safe offline drafts
- Reorder notifications and configurable alert channels

### Could-Have (Backlog)
- Customer loyalty / discount rules administration
- Scheduled promotions for selected products
- Bulk product import via CSV
- Multi-store / multi-register support within one business tenant
- Dark mode and density toggles
- Two-factor authentication for Super Admin and Business Owner accounts
- Direct GCash/Maya API integration only if a future business case, provider access, and security review justify it

---

## Tech Stack

| Layer | Choice | Version (target) |
| --- | --- | --- |
| Framework | **React** | 18.3.x |
| Language | **TypeScript** | 5.5.x |
| Build / dev server | **Vite** | 5.x |
| Routing | **React Router** | 6.26.x |
| Server-state | **TanStack Query** (`@tanstack/react-query`) | 5.x |
| Client-state | **Zustand** | 4.x |
| Forms + validation | **react-hook-form** + **zod** | 7.x / 3.x |
| Tables | **TanStack Table** (`@tanstack/react-table`) | 8.x |
| HTTP | **axios** + interceptors | 1.x |
| UI primitives | **shadcn/ui** (Radix UI under the hood) | latest |
| Styling | **Tailwind CSS** | 3.4.x |
| Icons | **lucide-react** | latest |
| Charts | **Recharts** | 2.x |
| Realtime | **@stomp/stompjs** (STOMP over WebSocket) | 7.x |
| CSV export | **papaparse** | 5.x |
| PDF (client) | **@react-pdf/renderer** | 4.x |
| Barcode (webcam) | **@zxing/browser** | 0.1.x |
| Date utilities | **date-fns** | 3.x |
| Testing (unit/component) | **Vitest** + **React Testing Library** | 2.x / 16.x |
| Testing (E2E) | **Playwright** | 1.x |
| Linting / formatting | **ESLint** + **Prettier** | 9.x / 3.x |

> Version targets are pinned at planning time. Lock exact versions in `package.json` during Phase 1.

---

## Proposed Folder Structure

```
web/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                       # bootstraps React + QueryClient + Router
│   ├── App.tsx                        # router outlet + global providers
│   ├── app/
│   │   ├── providers/
│   │   │   ├── QueryProvider.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   └── ToastProvider.tsx
│   │   ├── router/
│   │   │   ├── routes.tsx             # route table
│   │   │   ├── RequireAuth.tsx
│   │   │   └── RequireRole.tsx
│   │   └── layout/
│   │       ├── AppShell.tsx           # top bar + sidebar + outlet
│   │       ├── Sidebar.tsx
│   │       └── Topbar.tsx
│   ├── shared/
│   │   ├── api/
│   │   │   ├── axios.ts               # client + interceptors
│   │   │   ├── auth.ts
│   │   │   ├── catalog.ts
│   │   │   ├── inventory.ts
│   │   │   ├── orders.ts
│   │   │   ├── pos.ts
│   │   │   ├── messages.ts
│   │   │   ├── reports.ts
│   │   │   └── users.ts
│   │   ├── ws/
│   │   │   └── stompClient.ts
│   │   ├── types/                     # domain types shared across features
│   │   ├── components/                # shadcn primitives + DataTable, EmptyState, ErrorState
│   │   ├── hooks/                     # useDebounce, usePrintReceipt, useBarcodeScanner
│   │   ├── lib/                       # money, dates, role guards
│   │   └── config/
│   │       └── env.ts                 # typed import.meta.env access
│   ├── features/
│   │   ├── platform-admin/            # businesses, plans, subscriptions, system health
│   │   ├── tenant/                    # selected business + tenant guards
│   │   ├── auth/
│   │   │   ├── pages/LoginPage.tsx
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── dashboard/
│   │   ├── catalog/
│   │   │   ├── pages/ProductListPage.tsx
│   │   │   ├── pages/ProductFormPage.tsx
│   │   │   ├── pages/CategoryListPage.tsx
│   │   │   └── components/
│   │   ├── inventory/
│   │   │   ├── pages/InventoryListPage.tsx
│   │   │   ├── pages/MovementLogPage.tsx
│   │   │   ├── pages/AdjustStockDialog.tsx
│   │   │   └── pages/RestockPage.tsx
│   │   ├── pos/
│   │   │   ├── pages/PosPage.tsx
│   │   │   ├── components/CartPanel.tsx
│   │   │   ├── components/ScanInput.tsx
│   │   │   ├── components/PaymentDialog.tsx
│   │   │   └── components/ReceiptView.tsx
│   │   ├── orders/
│   │   │   ├── pages/OrderListPage.tsx
│   │   │   ├── pages/OrderDetailPage.tsx
│   │   │   └── components/StatusChip.tsx
│   │   ├── messaging/
│   │   ├── chatbot/
│   │   ├── payments/
│   │   ├── subscriptions/
│   │   ├── storefront/                # customer-facing PWA
│   │   │   ├── pages/ChatPage.tsx
│   │   │   └── components/
│   │   ├── reports/
│   │   │   ├── pages/SalesReportPage.tsx
│   │   │   ├── pages/OrdersReportPage.tsx
│   │   │   └── pages/InventoryReportPage.tsx
│   │   ├── users/
│   │   │   ├── pages/UserListPage.tsx
│   │   │   └── pages/UserFormPage.tsx
│   │   └── settings/
│   │       └── pages/BusinessSettingsPage.tsx
│   ├── styles/
│   │   └── globals.css
│   └── test/
│       ├── setup.ts
│       └── utils.tsx
├── e2e/
│   └── pos.spec.ts
├── .env.example
├── index.html
├── package.json
├── tailwind.config.ts
├── postcss.config.cjs
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Prerequisites

- **Node.js** 20.x LTS (verify with `node -v`)
- **npm** 10.x (or `pnpm` 9.x — recommended for faster installs; lockfile choice is fixed during Phase 1)
- A modern evergreen browser: **Chrome / Edge 120+** or **Firefox 120+**
- Cashier hardware (production): a USB barcode scanner (keyboard wedge) and a thermal receipt printer driven by the host OS print spooler
- Network access to the OrderSync Laravel API and realtime endpoints

---

## Setup & Installation

```bash
# 1. Enter the web project
cd web

# 2. Install dependencies
npm install              # or: pnpm install

# 3. Copy and edit env
cp .env.example .env.local

# 4. Start the dev server
npm run dev              # Vite, default http://localhost:5173
```

---

## Running the App

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally for smoke testing |
| `npm run lint` | ESLint over `src/` |
| `npm run format` | Prettier write |
| `npm run test` | Vitest run (unit + component) |
| `npm run test:watch` | Vitest watch mode |
| `npm run e2e` | Playwright E2E suite (requires dev server or preview running) |

---

## Environment Configuration

Vite exposes any variable prefixed with `VITE_` to the client at build time. `.env.local` (gitignored) is the developer-local override.

| Variable | Required | Example | Description |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | yes | `https://api.ordersync.local/api/v1` | Base URL for REST endpoints |
| `VITE_WS_BASE_URL` | yes | `wss://api.ordersync.local/ws` | STOMP/WebSocket endpoint |
| `VITE_APP_ENV` | yes | `dev` / `staging` / `prod` | Selects logging verbosity and feature flags |
| `VITE_ENABLE_HTTP_LOGS` | no | `true` | Enables axios request/response logging in non-prod |
| `VITE_LOW_STOCK_BANNER` | no | `true` | Toggles the admin low-stock banner in the app shell |
| `VITE_PWA_ENABLED` | no | `true` | Enables installable PWA behavior and service-worker registration |
| `VITE_AI_SUPPORT_ENABLED` | no | `false` | Enables AI-assisted support when a backend provider is configured |

Values are read in `src/shared/config/env.ts` through a typed `z.object({...}).parse(import.meta.env)` so missing required keys fail fast at boot.

---

## Build & Deployment

The output of `npm run build` is a fully static bundle in `dist/`. Recommended hosting options:

- **Behind the Laravel backend** as static resources under `/` with the API mounted at `/api` (no CORS, simplest cookie story).
- **Standalone static host** (nginx, Caddy, S3 + CloudFront) with the backend reverse-proxied at `/api`.

For SPAs, ensure the host serves `index.html` for any unknown route (history-mode fallback). A sample nginx block is included in `docs/deploy/nginx.conf.example` (added in Phase 11).

### Production checklist

- HTTPS terminated at the edge; HSTS enabled
- Strict `Content-Security-Policy` (script-src self + `wss:` for backend)
- `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`
- Long-cache hashed assets (`/assets/*`) and short-cache `index.html`
- Backend issues refresh tokens via `Secure; HttpOnly; SameSite=Strict` cookies

---

## Testing Approach

| Tier | Tooling | Scope |
| --- | --- | --- |
| Unit | **Vitest** | Pure TS: API mappers, formatters, role guards, zod schemas |
| Component | **Vitest + React Testing Library** | Form validation, table rendering, role-conditional UI, dialogs |
| E2E | **Playwright** | Critical paths: login, complete a POS sale (with mocked scanner), confirm an online order, run a daily report |

Coverage target for MVP: **70%** on `src/shared/` and `src/features/**/api` and `src/features/**/hooks`.

---

## Contribution & Branching

- **Default branch**: `main` (protected; release-ready only)
- **Integration branch**: `develop`
- **Feature branches**: `feature/<short-slug>` cut from `develop`
- **Fix branches**: `fix/<short-slug>` cut from `develop` (or `main` for hotfixes)
- **Pull requests**: target `develop`; require 1 reviewer, green CI, and all checkboxes in the linked `task.md` entry ticked
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`)
- **Code style**: `npm run lint` and `npm run format -- --check` must pass before pushing

---

## License

TBD — license file to be added before public release. Until then, all rights reserved by the project owner.
