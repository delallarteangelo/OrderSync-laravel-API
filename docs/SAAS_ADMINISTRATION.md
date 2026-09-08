# SaaS Administration and Subscriptions

Phase 3 establishes the OrderSync platform control plane. All mutations are owned by Laravel, persisted in PostgreSQL, restricted to `SUPER_ADMIN`, and audited. No external billing or payment provider is connected.

## Business lifecycle

Businesses move through explicit states:

| Current state | Allowed transition | Result |
| --- | --- | --- |
| `PENDING` | Approve | Activates the business and starts a one-month Basic subscription |
| `ACTIVE` | Suspend | Preserves tenant data and immediately revokes tenant access and refresh tokens |
| `SUSPENDED` | Reactivate | Restores tenant sign-in without changing memberships or business records |

Public registration creates a new global owner identity, a `BUSINESS_OWNER` membership, and a pending business in one transaction. Pending and suspended businesses cannot obtain or refresh tenant sessions.

## Plans and entitlements

Plan codes are immutable: `BASIC`, `STANDARD`, and `PREMIUM`. Prices are deliberately unconfigured until a Super Admin enters approved amounts. Currency is PHP and billing is monthly.

The initial entitlement matrix is a configurable product baseline, not client-side authorization. It covers maximum users and feature flags for catalog, inventory, POS, customer ordering, messaging, analytics, and AI support. Later modules must read effective entitlements from Laravel rather than hard-code plan differences.

## Subscription lifecycle

Each business has at most one current subscription. Assignment and renewal update the current subscription transactionally while `subscription_events` preserves append-only history. Effective status is derived from the current period and optional grace deadline:

- before period end: `ACTIVE`
- after period end but before grace end: `GRACE`
- after both deadlines: `EXPIRED`
- explicitly cancelled: `CANCELLED`

Renewal starts from the later of the current period end or the current time. Granting grace does not extend the paid period. Reassigning a plan begins a new current period and records the prior plan and status.

## Billing records

Billing records are internal, manually maintained records. Amounts use integer minor units, the current currency is PHP, and a Super Admin may create a pending record and mark a pending or overdue record paid with an optional internal reference. These records do not imply payment-provider confirmation and do not accept payment-proof uploads; recorded wallet payments remain Phase 7.

## API contracts

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/business-registrations` | Submit a public business/owner application; throttled |
| `GET` | `/api/v1/platform/dashboard` | Platform business, subscription, user, billing, and health metrics |
| `GET` | `/api/v1/platform/businesses` | Paginated business lifecycle list |
| `POST` | `/api/v1/platform/businesses/{id}/approve` | Approve a pending business |
| `POST` | `/api/v1/platform/businesses/{id}/suspend` | Suspend a business with a required reason |
| `POST` | `/api/v1/platform/businesses/{id}/reactivate` | Reactivate a suspended business |
| `GET/PATCH` | `/api/v1/platform/plans[/{id}]` | Read or configure fixed plans and entitlements |
| `PUT` | `/api/v1/platform/businesses/{id}/subscription` | Assign a plan and begin a current period |
| `POST` | `/api/v1/platform/subscriptions/{id}/renew` | Renew for 1–24 months |
| `POST` | `/api/v1/platform/subscriptions/{id}/grace` | Grant 1–90 grace days |
| `POST` | `/api/v1/platform/subscriptions/{id}/cancel` | Cancel a subscription |
| `GET` | `/api/v1/platform/subscriptions/{id}/history` | Read append-only lifecycle events |
| `GET/POST` | `/api/v1/platform/billing-records` / subscription billing route | List or create internal bills |
| `POST` | `/api/v1/platform/billing-records/{id}/mark-paid` | Record manual settlement |
| `GET/PATCH` | `/api/v1/platform/users[/{id}/status]` | List users or activate/deactivate an account |
| `GET` | `/api/v1/tenant/subscription` | Let the authenticated Business Owner read only the current tenant subscription |

Platform routes require a platform token whose authoritative role is `SUPER_ADMIN`. Tenant subscription reads derive the business exclusively from the authenticated token.

## Audit events

Business registration, approval, suspension, reactivation, plan configuration, subscription assignment/renewal/grace/cancellation, billing creation/payment, and user status changes create audit records. Subscription lifecycle events additionally retain from/to plan and status values. Neither audit stream may contain passwords, tokens, cookies, or payment-proof files.
