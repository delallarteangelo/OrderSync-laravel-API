# Authentication and Tenant Boundary

Phase 2 establishes the identity and authorization boundary used by every later business module. Laravel is authoritative; clients never grant themselves a role or business context.

## Identity model

- A user is a global identity with one email address and an active/inactive state.
- `SUPER_ADMIN` is the only platform role and is stored on the user.
- `BUSINESS_OWNER`, `STAFF`, `CASHIER`, and `CUSTOMER` are business membership roles.
- A user may have active memberships in multiple businesses.
- A tenant access token is permanently bound to one `business_id`. Sending a different `X-Business-Id` is rejected rather than changing context.
- A platform access token has no business and is valid only for an active `SUPER_ADMIN`.

## Token lifecycle

- Access tokens expire after 15 minutes by default.
- Refresh tokens expire after 30 days by default and rotate on every use.
- Only SHA-256 token hashes are stored in PostgreSQL. Plain tokens exist only in the issuing response and client memory/cookie.
- Browser refresh tokens use an HttpOnly cookie scoped to `/api/v1/auth`.
- Android requests identify themselves with `X-Client-Platform: mobile` and receive the rotating refresh token in the response body for future secure-device storage.
- Logout revokes the current access token and supplied refresh token.
- Password changes revoke other active sessions.
- Account or membership deactivation invalidates tokens on their next use.

Production must use HTTPS, `AUTH_REFRESH_COOKIE_SECURE=true`, an appropriate SameSite setting, strict allowed origins, and a secret-management system.

## API contracts

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Public, throttled | Validate credentials and select a business context |
| `POST` | `/api/v1/auth/refresh` | Refresh token, throttled | Rotate refresh and access tokens |
| `POST` | `/api/v1/auth/logout` | Bearer token | Revoke the current session |
| `GET` | `/api/v1/auth/me` | Bearer token | Return the authoritative user, role, memberships, and active business |
| `GET` | `/api/v1/auth/businesses` | Bearer token | List active memberships available to the user |
| `POST` | `/api/v1/auth/switch-business` | Bearer token | Reissue the session for another authorized membership |
| `POST` | `/api/v1/auth/change-password` | Bearer token | Change password and revoke other sessions |
| `GET` | `/api/v1/tenant/context` | Tenant bearer token | Prove the resolved business and membership context |
| `GET` | `/api/v1/platform/context` | Super Admin bearer token | Prove platform-level authorization |

Login accepts `email`, `password`, and optional integer `businessId`. If an account has multiple memberships and no business is supplied, the API returns `409 BUSINESS_SELECTION_REQUIRED` with the permitted business summaries. A business ID that is not an active membership returns `403` without exposing unrelated business data.

## Server-side authorization

`auth.access` resolves and validates the token, account, business, and current membership. `tenant` requires a tenant-bound context and rejects header overrides. `role` enforces route roles. Laravel policies remain the authorization mechanism for model actions; the initial `BusinessPolicy` distinguishes view, update, and prohibited delete access.

All later tenant-owned tables must have or inherit `business_id`, and queries must derive that value from the authenticated request context rather than request input.

## Audit foundation

Authentication login, refresh, logout, business switch, and password changes create append-only audit records. Audit metadata must remain allowlisted and must never contain credentials, bearer tokens, refresh tokens, cookies, or private files.
