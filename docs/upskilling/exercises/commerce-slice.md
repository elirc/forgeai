# Commerce-slice exercises

All exercises use a local branch or patch, synthetic data, and the README setup. Keep the default application correct.

## Warm-up: pin the retry schedule

Prerequisites: reading a pure function.

Goal: predict `retryDelayMs(2, () => 0.5)` and `retryDelayMs(7, () => 0)` from `apps/api/src/platform/jobs.ts:19-23` before running anything.

**Check:** add both assertions to the test "bounds exponential backoff and jitter" and run `npm test -- -t "bounds exponential backoff"`. The correct values are `1500` (2 s × 0.75) and `30000` (the uncapped 64 s is clamped to 60 s, then × 0.5). If the test fails, recompute rather than editing the expectation to match.

## Junior: inspect an order's purchased lines

Prerequisites: REST handlers, SQL SELECT and Zod. Follow the order GET handler and immutable `order_lines` table.

Goal: add a tenant-scoped endpoint that returns product name, SKU, purchased quantity and unit price. Do not read current catalog prices to reconstruct history.

Acceptance: anonymous requests return 401, another tenant cannot read the order, invalid UUIDs return 400, and a catalog price change does not change the response. Add a PostgreSQL API test.

Verify with `npm run typecheck` and `npm test`. Hint: authorize before lookup, and join on tenant ID plus order ID. Further hints and solution approach: [solution notes](commerce-slice-solutions.md).

Where to start: the existing `GET /orders/:id` handler (`apps/api/src/app.ts:182-186`) and `CREATE TABLE order_lines` (`packages/database/migrations/001_foundation.sql:73`). The test helpers `addProduct`, `purchase` and `headers()` are at the top of `tests/integration.test.ts`.

**Check:** `npm test` passes, with a new test that does the following:

1. buys a product;
2. changes its price through `PATCH /products/:id`;
3. asserts that the lines endpoint still returns the original `unit_price_cents`;
4. asserts 401 without a cookie, 404 as `owner@harbor.example`, and 400 for `/orders/not-a-uuid/lines`.

## Mid-level: keyset pagination for audit history

Prerequisites: composite indexes, stable sort order and API errors.

Goal: replace the latest-30 audit response with bounded cursor pagination. Encode created time and ID; validate cursor data. Preserve tenant filtering. Do not use an ever-growing offset.

Acceptance: no duplicates across pages with equal timestamps; malformed cursors return 400; a cursor from another tenant grants no access; new events do not reorder already traversed history unexpectedly. Add tests with equal timestamps and concurrent inserts.

Verify API tests and inspect the SQL query plan on seeded larger data. Explain why both sort keys are in the cursor.

Where to start: the current query is `ORDER BY created_at DESC, id LIMIT 30` in the `/activity` handler (`apps/api/src/app.ts:231-239`). The existing index is `audit_log_tenant_time_idx ON audit_log(tenant_id, created_at DESC)` (`001_foundation.sql:175`), so it has no `id` tie-breaker. Add the new index in a **new** migration file (`002_...sql`). Never edit `001_foundation.sql`: `migrate()` stores a SHA-256 of every applied file and throws `Applied migration changed` on a mismatch (`packages/database/src/index.ts:44-70`).

**Check:** `npm test` passes, with tests that cover the following:

1. insert several audit rows sharing one `created_at`, then page through with `limit=2` and assert no duplicates or gaps;
2. a garbage cursor returns 400;
3. a valid Northstar cursor used against Harbor returns only Harbor rows.

`EXPLAIN` on the new query shows an index scan on your new index.

## Advanced: safe reservation expiry proposal and implementation

Prerequisites: checkout, provider uncertainty, leases and compensation.

Goal: define and implement expiry without releasing stock for an already captured payment. Start with an ADR specifying provider status lookup, race handling, deadlines and order transitions. A blanket UPDATE of old reservations is unacceptable.

Acceptance: timeout-after-capture cannot cause a confirmed payment with released stock; expiry racing with payment finalization remains consistent; duplicate expiry runs have no extra effect; uncertain provider state opens an inspectable recovery path.

Verification requires controlled concurrent SQL connections, a durable provider fixture and failure tests. Explain any states that deliberately remain unresolved for human review. This is a feature expansion: update the requirements register and Academy lesson.
