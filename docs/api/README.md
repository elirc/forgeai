# Initial HTTP API

The browser uses same-origin `/api` routes proxied by Next.js to Fastify. No browser code has database credentials.

Authenticate with `POST /api/auth/login`, body `{ "email": "...", "password": "..." }`. Preserve the HttpOnly session cookie. `GET /api/auth/session` returns the user and current memberships. `POST /api/auth/logout` revokes that session.

Every unsafe request requires `Origin` equal to configured `WEB_ORIGIN` and `X-Forge-Request: 1`. Browser API code supplies these semantics. There is no API-key authentication yet.

Let `T=/api/tenants/{tenantId}`.

| Method / route          | Behavior                                             | Role                    |
| ----------------------- | ---------------------------------------------------- | ----------------------- |
| GET /api/health         | Process health                                       | Public                  |
| GET /api/ready          | Database/migration-table reachability                | Public                  |
| GET T/products          | Search and bounded pagination                        | Member                  |
| POST T/products         | Create product, opening stock, movement and audit    | Admin/operator          |
| GET T/products/{id}     | Tenant-scoped product                                | Member                  |
| PATCH T/products/{id}   | Update name/SKU/category/price with expected version | Admin/operator          |
| GET T/orders            | Search customer/name number and paginate             | Member                  |
| GET T/orders/{id}       | Tenant-scoped order                                  | Member                  |
| POST T/checkout         | Atomic order/reservation/outbox                      | Admin/operator          |
| POST T/orders/{id}/ship | Confirmed → shipped, duplicate-safe                  | Admin/operator          |
| GET T/summary           | Current tenant operational counts                    | Member                  |
| GET T/notifications     | Latest 30 in-app notifications                       | Member                  |
| GET T/activity          | Latest 30 audit events                               | Member                  |
| GET T/jobs              | Latest 50 durable jobs                               | Admin                   |
| POST T/jobs/{id}/replay | Replay a dead-letter job and audit                   | Admin                   |
| GET T/chaos             | Development failure configuration                    | Admin                   |
| POST T/chaos            | Five-minute tenant-scoped injection                  | Admin; development gate |

Product/order list parameters: `limit` 1–100 (default 25), `offset` 0–100000, `search` at most 100 characters. Responses contain `items` and `hasMore`. Sort order is fixed by created time descending, then ID. No arbitrary SQL sort input is accepted.

Checkout requires `Idempotency-Key` (8–128 alphanumeric/hyphen/underscore characters). The first accepted request returns 201; an identical retry returns 200 and `idempotency-replayed: true`. A reused key with different validated content returns 409. Keys are scoped to tenant and actor.

```json
{
  "customerName": "Jamie Rivera",
  "customerEmail": "jamie@example.test",
  "lines": [{ "productId": "a-valid-product-uuid", "quantity": 1 }]
}
```

Amounts and prices are authoritative on the server. Do not send a checkout total. Product creation accepts name, SKU, category, integer `priceCents`, and integer opening `stock`. Product update replaces stock with a positive expected `version`.

Errors have `{ "error": { "code": "...", "message": "...", "requestId": "..." } }`; validation errors also include safe field paths/messages. Codes distinguish authentication, forbidden action, missing resource, invalid origin, insufficient stock, stale version, duplicate fields and conflicting idempotency keys. Request IDs are also returned in headers.

These routes form an internal first version. Public versioned APIs, API keys, machine-readable OpenAPI, SDK distribution, webhook registration and real provider callbacks remain tracked work.
