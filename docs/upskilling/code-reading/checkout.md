# Trace a checkout without changing code

Start at [app.ts](../../../apps/api/src/app.ts). Submit one synthetic order and answer:

1. Which schema prevents a caller from supplying an authoritative total or duplicate product IDs?
2. Where is membership checked, and which role cannot mutate?
3. What scopes the idempotency key? What happens if the payload changes?
4. Why are product IDs sorted before locking?
5. Which fields become immutable purchase snapshots?
6. What single database statement prevents overselling?
7. Which writes disappear if the second cart line cannot reserve stock?
8. How can a worker discover the payment command after the API process exits?
9. Which identifier reaches both the provider and the local idempotency store?
10. Which condition prevents an expired worker owner from committing?
11. Where does shipment consume stock? Why is the second identical shipment harmless?
12. Which UI values are current-state counts rather than historical analytics?

Deliver a sequence diagram and exact function/file references. Then run the related integration tests and compare them with your diagram. If your diagram draws a database transaction around the external provider call, revise it.

Assessment: your explanation should distinguish authenticated identity, tenant policy, SQL atomicity, external uncertainty, and eventually visible UI state.

## Where to look (hints, not answers)

| Question | Start here                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | `checkoutSchema` in `packages/contracts/src/index.ts:41-63`                                                                               |
| 2        | `authorize` / `requireWrite` in `apps/api/src/modules/identity/service.ts:54-70`; the call at `app.ts:189`                                |
| 3        | `commerce/service.ts:44-62`. Look at what is concatenated into the advisory-lock key.                                                     |
| 4        | `commerce/service.ts:40-43` **and** `:69`. Which of the two actually fixes the order in which product rows are locked?                    |
| 5        | The `order_lines` insert at `commerce/service.ts:95-106`                                                                                  |
| 6        | `reserve` in `inventory/service.ts:4-30`                                                                                                  |
| 7        | `transaction` in `packages/database/src/index.ts:21-43`, plus the test "rolls back earlier reservations when a later item is unavailable" |
| 8        | The `jobs` insert at `commerce/service.ts:119-122`; `claimJob` in `platform/jobs.ts:24-41`                                                |
| 9        | `processOneJob` passes `orderId` to `provider.capture` (`jobs.ts:58-63`, `payments/provider.ts:28-36`)                                    |
| 10       | `payments/service.ts:19-23`                                                                                                               |
| 11       | `apps/api/src/modules/fulfillment/service.ts`, `settleReservations` in `inventory/service.ts:32-71`                                       |
| 12       | The `/summary` query at `app.ts:206-221`                                                                                                  |

## Review notes (verified 2026-10-06)

These are things a senior reviewer would raise about the code as it is. None of them breaks a documented invariant.

1. **Rate limits are per process.** `@fastify/rate-limit` is registered with its default in-memory store (`app.ts:52`, login override at `:124`). Each API instance therefore keeps its own counters. That is fine for the single-process demo, but not as a production brute-force control.
2. **A fenced-out worker is silent.** When `applyPaymentResult` returns `false` because the lease was lost (`payments/service.ts:23`), `processOneJob` ignores the return value (`jobs.ts:64`). Nothing is logged or counted, so a stream of lost leases (a lease that is too short for slow providers) would be invisible. That is relevant to the durable-jobs lesson's advice to "monitor oldest job age".
3. **Order and product listing use `OFFSET`** (`commerce/service.ts:26-28`). The supporting indexes (`orders_tenant_page_idx`, `products_tenant_page_idx`) already include `id`. The audit index does not, which is the starting point of the mid-level exercise.
4. **Revenue is summed as `float8`** (`app.ts:212`). It is exact for integer cents below 2^53, so this is a type-hygiene point rather than a bug. A ledger milestone would switch to `bigint` or `numeric` end to end.
