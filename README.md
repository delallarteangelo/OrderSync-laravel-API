# OrderSync

**A Business Management Platform for Micro and Small Businesses**

OrderSync is a startup Software-as-a-Service (SaaS) product that helps micro and small businesses manage inventory, point-of-sale transactions, customer orders, payments, communication, and business analytics from one connected platform.

Tonette's Minimart is the initial pilot business and demo tenant. The product, data model, branding, workflows, and documentation must remain reusable by other businesses and must not contain tenant-specific assumptions.

## Product Scope

OrderSync combines four connected experiences:

- **SaaS administration:** platform-wide business accounts, subscriptions, payments, users, AI configuration, and system health.
- **Business operations:** a browser-based dashboard for business owners and staff to run inventory, POS, orders, reporting, and customer communication.
- **Customer ordering:** a mobile app and Progressive Web App (PWA) for browsing a business's catalog, placing and tracking orders, submitting payment proof, and getting support.
- **Shared platform services:** a multi-tenant Laravel API, persistent data store, realtime updates, notifications, audit logs, payment records, and an AI-provider adapter.

## User Roles

| Role | Scope | Main responsibilities |
| --- | --- | --- |
| **Super Admin** | Entire OrderSync platform | Approve and manage business accounts, plans, subscriptions, payments, users, AI knowledge bases, and system health |
| **Business Owner** | One business tenant | Manage products, staff, settings, sales, inventory, orders, and analytics |
| **Staff / Cashier** | Assigned business tenant | Process POS transactions, update permitted inventory records, verify payments, and handle customer orders |
| **Customer** | Selected business storefront | Browse products, manage a cart, place and track orders, submit payments, and contact support |

All tenant-owned records must include a business identifier and be protected by server-side tenant isolation. A business owner or staff member must never be able to read or change another business's records.

## Core Modules

- **Real-time inventory:** products, categories, live stock, stock movements, low-stock alerts, reorder notifications, and inventory history.
- **Point of sale:** sales processing, automatic stock deduction, daily sales monitoring, transaction history, and digital receipts.
- **Online ordering:** catalog, cart, order placement, approval workflow, tracking, history, and customer communication.
- **AI customer support:** product and stock inquiries, order-status help, FAQs, business announcements, and human handoff. The provider is selected behind an adapter after comparing cost, reliability, and implementation effort.
- **Analytics:** daily, weekly, and monthly sales, revenue, best-selling and slow-moving products, inventory reports, and customer purchase trends.
- **Recorded digital payments:** business-managed GCash/Maya QR instructions, reference details, uploaded screenshot/receipt, manual verification, payment history, and audit logs. The MVP does not depend on direct GCash or Maya APIs.
- **Subscriptions:** Basic, Standard, and Premium plans; renewals; billing records; payment proof and verification; platform revenue reports; and feature/usage entitlements.
- **Progressive Web App:** installable, responsive ordering and management experiences with an offline-safe shell and queued drafts where appropriate. Final stock, order, payment, and subscription writes always require server confirmation.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `app/`, `routes/`, `database/` | Laravel multi-tenant backend and platform API |
| `web/` | React/Vite SaaS admin, business operations, POS, analytics, and PWA surfaces |
| `minigrocery_androidapp/` | Flutter customer ordering app; retained directory name for compatibility |
| `resources/`, `public/` | Laravel entry point and shared web assets |

## Product Rules

1. Use **OrderSync** for platform branding. Business names are tenant data, not product names.
2. Enforce tenant isolation and role permissions on the server; UI guards are supplementary.
3. Record every stock, order-status, payment-verification, subscription, and privileged administrative change in an audit trail.
4. Treat GCash and Maya as manually verified payment records in the MVP, with proof-of-payment uploads and no assumption of direct payment-provider APIs.
5. Keep AI access grounded in the selected business's catalog, stock, orders, FAQ entries, and announcements. Never expose another tenant's data.
6. Keep subscription plan entitlements configurable instead of hard-coding plan differences in clients.

## Development Documentation

- [Local development setup](docs/SETUP.md)
- [Authentication and tenant boundary](docs/AUTH_TENANCY.md)
- [SaaS administration and subscriptions](docs/SAAS_ADMINISTRATION.md)
- [Catalog and inventory](docs/CATALOG_INVENTORY.md)
- [Point of sale](docs/POINT_OF_SALE.md)
- [Current build status](docs/BUILD_STATUS.md)
- [Web system overview](web/README.md)
- [Web implementation plan](web/implementation_plan.md)
- [Web task tracker](web/task.md)
- [Customer app overview](minigrocery_androidapp/README.md)
- [Customer app implementation plan](minigrocery_androidapp/implementation_plan.md)
- [Customer app task tracker](minigrocery_androidapp/task.md)
- [Customer app design system](minigrocery_androidapp/Design.md)

## Current Status

Phases 1-5 are complete: the repository foundation, PostgreSQL environment, tenant authentication/authorization, SaaS administration/subscriptions, React-connected catalog/inventory, and transactional point of sale are implemented and verified. Customer ordering, payment-proof verification, notification delivery, analytics, AI support, PWA hardening, deployment, and the remaining Flutter business integrations are deferred to their separately approved phases.

## License

TBD. Until a license is selected, all rights are reserved by the project owner.
