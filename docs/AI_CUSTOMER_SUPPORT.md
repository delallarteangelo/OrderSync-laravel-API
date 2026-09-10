# AI Customer Support

Phase 10 adds a provider-neutral, tenant-grounded customer-support foundation without selecting or calling an external AI provider. The active `LOCAL_GROUNDED` adapter is deterministic and has zero provider cost: it assembles answers only from published tenant knowledge, current tenant product/stock data, and the authenticated customer's own orders. It does not invent an answer when no verified grounding is available.

## Provider boundary

Laravel resolves the `AiSupportProvider` contract server-side. Provider credentials are not accepted by any API and are never stored in React or Flutter. The current adapter reports:

- provider: `LOCAL_GROUNDED`
- model: none
- external provider configured: false
- estimated provider cost: zero

Adding OpenAI, Claude, or another network provider requires a separate proposal that presents current provider options, expected costs, privacy/retention behavior, credentials management, and a cost ceiling for approval. Phase 10 does not select or purchase one.

## PostgreSQL records

| Table | Purpose |
| --- | --- |
| `ai_knowledge_entries` | Tenant FAQs and announcements, publication state, keywords, and responsible users. |
| `ai_support_settings` | Per-tenant enablement, daily customer limit, monthly business limit, and maximum question size. |
| `ai_support_runs` | Immutable provider, tool, status, character, latency, reason, and estimated-cost metadata. Question and response content remain in the authorized conversation. |
| `support_handoffs` | One open human-support handoff per conversation with durable request and resolution state. |
| `conversation_messages` | Extended with an `AI` kind and `AI` sender role so automated answers can never appear as human messages. |

All Phase 10 records carry or inherit `business_id`. The development database was migrated additively and no development data was inserted.

## Grounding tools

The adapter receives only data retrieved by server-owned tools:

- `tenant_knowledge` returns active, published FAQs or announcements from the authenticated business.
- `tenant_product_stock` returns active products, current on-hand stock, and current selling price from that business only.
- `customer_order_status` returns an order only when both `business_id` and `customer_user_id` match the authenticated session. An order-thread lookup is also constrained to that thread's owned order.

Product cost, another tenant's data, another customer's orders, payment-proof files, tokens, audit metadata, and provider/system instructions are never placed in the support context.

## Answer and handoff behavior

1. The customer explicitly chooses **Ask AI** in an existing owned conversation.
2. Laravel enforces Premium `ai_support_enabled`, Messaging entitlement, tenant ownership, input size, throttling, and configured usage limits.
3. The prompt guard rejects attempts to reveal hidden instructions or credentials, bypass authorization, or request another tenant/customer's data.
4. Laravel retrieves permitted grounding and passes only that context through the provider contract.
5. A grounded answer is stored as an immutable, visibly `AI`-labeled conversation message.
6. Unsafe, ungrounded, or unavailable responses refuse to guess and open a human handoff. The customer can also request a handoff directly.
7. Business Owners, Staff, or Cashiers can view and resolve the handoff; resolution is appended to the conversation and notified to the customer.

Conversation history is preserved throughout handoff. Human replies continue through the Phase 8 messaging contract.

## Usage and privacy

Defaults are 20 requests per customer per business-local day, 500 requests per tenant per business-local month, and 1,000 characters per question. A Business Owner can reduce or raise these values within server validation limits or disable automated support while leaving human messaging available.

Usage summaries include request counts, answered/handoff counts, input/output character counts, average latency, and estimated cost in minor units. The current local adapter always records zero cost. AI audit events store operational metadata but never the question, answer, knowledge content, password, token, or provider secret.

## API contract

All routes are under `/api/v1`, require an authenticated tenant, effective Messaging and AI Support entitlements, and the listed role.

| Method | Route | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/ai/published` | Customer | Active published tenant FAQs and announcements. |
| `POST` | `/threads/{thread}/assistant` | Customer | Ask the grounded assistant inside an owned thread. |
| `POST` | `/threads/{thread}/handoff` | Customer | Request human support without an AI question. |
| `GET`, `POST` | `/ai/knowledge` | Business Owner | List or create tenant knowledge. |
| `PUT` | `/ai/knowledge/{knowledge}` | Business Owner | Update an owned knowledge entry. |
| `POST` | `/ai/knowledge/{knowledge}/deactivate` | Business Owner | Remove an entry from published grounding without deleting history. |
| `GET`, `PUT` | `/ai/settings` | Business Owner | Read or change local assistant limits and enablement. |
| `GET` | `/ai/usage` | Business Owner | Read the current business-month usage and cost summary. |
| `GET` | `/ai/handoffs` | Business Owner, Staff, Cashier | Read this tenant's handoff queue. |
| `POST` | `/ai/handoffs/{handoff}/resolve` | Business Owner, Staff, Cashier | Resolve an owned handoff. |

## Client behavior

- React provides a Business Owner AI-support workspace for knowledge publication, limits, usage, cost visibility, and handoff resolution. AI messages and open handoffs are distinct in the business conversation view.
- Flutter provides an explicit Ask AI mode, tenant-published FAQ/announcement suggestions, visibly labeled AI messages, error fallback, and one-tap human handoff. Normal human messaging remains the default.
- Normal development calls Laravel directly; AI MSW handlers are retained only for automated React tests.

## Validation coverage

Automated tests cover tenant knowledge isolation, Premium entitlement enforcement, AI message labeling, exact product/stock grounding, customer-owned order lookup, foreign-order non-disclosure, injection refusal, ungrounded handoff, configurable limits, handoff resolution, content-minimized audit metadata, immutable usage runs, tenant-scoped React caches, typed client contracts, Flutter assistant/handoff state, and all prior phase regressions.

## Explicit deferrals

No external generative model, embeddings/vector database, provider key, provider billing, streaming response, semantic search, model training, voice assistant, or background push delivery was introduced. Provider evaluation and any network-backed generation require separate approval; customer-web/PWA packaging remains Phase 11.
