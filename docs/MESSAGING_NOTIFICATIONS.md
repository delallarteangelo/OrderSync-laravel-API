# Messaging, Realtime Events, and Notifications

Phase 8 adds tenant-scoped human conversations, durable order/payment activity, unread state, notification preferences, and local foreground delivery. PostgreSQL remains authoritative for every message, notification, and event.

## Scope and delivery model

- Customers have one general support thread per tenant and one order thread per order.
- Business Owners, Staff, and Cashiers can participate in support threads for their authenticated tenant.
- Order placement/status and recorded-payment submission/review append immutable system messages to the related order thread.
- User notifications are stored separately from messages and respect per-user message, order, and payment preferences.
- Durable `realtime_events` provide an authenticated cursor-based polling contract. React polls foreground data every five seconds; Android polls events every five seconds while its authenticated app session is active.
- Foreground web updates use in-app toasts. Foreground Android updates use an in-app banner.

No Firebase project, device token, background push provider, WebSocket service, external account, or paid notification service was added. Those require a separate approved proposal.

## PostgreSQL records

| Table | Purpose |
| --- | --- |
| `conversation_threads` | General or order-specific tenant/customer conversation identity and latest activity. |
| `conversation_messages` | Immutable human and system message history. |
| `conversation_read_states` | Per-user last-read message and timestamp for unread calculation. |
| `notification_preferences` | Per-tenant/user message, order, and payment delivery choices. |
| `user_notifications` | User-targeted foreground notification inbox and read timestamp. |
| `realtime_events` | Immutable, user-targeted event log for cursor polling. |

Database constraints enforce valid thread parents, human/system sender shapes, allowed roles/types, trimmed message length, and one general or order thread for each applicable tenant scope.

## API contract

All routes require an access token bound to the current tenant, an effective subscription, the `messaging_enabled` entitlement, and one of `BUSINESS_OWNER`, `STAFF`, `CASHIER`, or `CUSTOMER`.

| Method | Route | Behavior |
| --- | --- | --- |
| `GET` | `/api/v1/threads` | Lists only threads visible to the current tenant/user with unread counts. |
| `POST` | `/api/v1/threads` | Customer-only idempotent creation of a general or owned-order thread. |
| `GET` | `/api/v1/threads/{thread}/messages` | Returns up to 100 ordered messages after ownership checks. |
| `POST` | `/api/v1/threads/{thread}/messages` | Sends an immutable human message, creates recipient records, and audits metadata. |
| `POST` | `/api/v1/threads/{thread}/read` | Advances the current user's read state. |
| `GET` | `/api/v1/notifications` | Returns the current user's notification inbox and unread total. |
| `POST` | `/api/v1/notifications/{notification}/read` | Marks only the current user's tenant notification read. |
| `POST` | `/api/v1/notifications/read-all` | Marks all current-user tenant notifications read. |
| `GET`, `PUT` | `/api/v1/notification-preferences` | Reads or replaces all three current-user preferences. |
| `GET` | `/api/v1/events?after={cursor}` | Returns up to 100 later durable events and the next cursor. |

## Security and audit rules

- Every query is constrained by the token-bound `business_id`; customer thread access is additionally constrained by `customer_user_id`.
- Foreign-tenant and other-customer identifiers are returned as not found.
- Messages and realtime events cannot be updated or deleted through their model contracts.
- Message-send audits record thread identity, kind, and character count, but intentionally omit message bodies.
- Notification preference changes are audited with their resulting boolean values.
- Preferences suppress new notification/event delivery records, not the authoritative conversation or business activity record.

## Client behavior

- React uses the Laravel endpoints in normal development; its former messaging fixtures remain available only to automated MSW tests.
- The web inbox shows durable threads, optimistic sends reconciled with server responses, system activity, unread badges, and the notification center/preferences.
- Android uses the same authenticated endpoints for thread lists, history, sends, read state, notification inbox, read-all, preferences, event polling, and foreground banners.
- Both clients stop background polling when their runtime is not in the foreground. Android background/terminated delivery is not available without a separately approved push-provider phase.
