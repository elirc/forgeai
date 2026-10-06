# The last item on the shelf

## What it is

A transaction protects a group of writes. A conditional update also protects a business decision when multiple transactions compete. These solve related but different problems.

## Why it exists

“Read stock, then subtract one” works in a single-user demo. Two checkouts can both read one remaining item and both promise it to customers.

## Forge example and follow the code

Read [commerce/service.ts](../../../apps/api/src/modules/commerce/service.ts), [inventory/service.ts](../../../apps/api/src/modules/inventory/service.ts), and [the transaction helper](../../../packages/database/src/index.ts).

`checkout` sorts products, obtains stable price snapshots, creates an order, calls `reserve`, and persists the payment command before commit. It uses one checked-out client throughout.

## Request/data flow

HTTP input → runtime validation → authorized principal → scoped idempotency lock → order and lines → conditional stock reservation → payment intent → durable job → audit → commit.

This is the real statement from `reserve` (`inventory/service.ts:13-19`):

```sql
UPDATE inventory SET reserved = reserved + $3
WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id = (
  SELECT warehouse_id FROM inventory WHERE tenant_id=$1 AND product_id=$2 ORDER BY warehouse_id LIMIT 1
) AND on_hand - reserved >= $3 RETURNING warehouse_id
```

The subquery picks the tenant's first warehouse, which matches the one-warehouse policy in the README. Under PostgreSQL's default READ COMMITTED isolation, a conflicting updater waits and then rechecks the condition against the updated row. If no row is returned, the stock was insufficient, and `reserve` throws `409 INSUFFICIENT_STOCK` (`inventory/service.ts:20-25`).

Line by line through `checkout` (`commerce/service.ts:32-134`):

| Lines     | What happens                                                                                                                                   | Why                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `40-44`   | Lines are sorted by product ID, then the request is fingerprinted with SHA-256                                                                 | The same cart in any order gets the same fingerprint. The row-lock order itself comes from `ORDER BY id` at `:69`, and the reservations follow that order. |
| `47-49`   | `pg_advisory_xact_lock(hashtextextended(tenant:user:key))`                                                                                     | Two concurrent retries with the same key queue up instead of both inserting                                                                                |
| `50-62`   | Look up an existing order for `(tenant, actor, key)`. A different fingerprint returns 409 `IDEMPOTENCY_CONFLICT`; the same fingerprint replays | Idempotency is scoped to the actor and checks the payload too                                                                                              |
| `63-73`   | `SELECT ... FOR SHARE` on the tenant's products                                                                                                | Price and name are read under a share lock, so a concurrent edit cannot change them mid-checkout                                                           |
| `79-113`  | Insert the order and the snapshot lines, and reserve each product                                                                              | All on the same `client`                                                                                                                                   |
| `114-130` | Insert the payment intent, the `payment.requested` job and the audit row                                                                       | The outbox write commits or rolls back with the order                                                                                                      |
| `133`     | `getOrder` runs **after** commit, on the pool                                                                                                  | The response reflects committed state                                                                                                                      |

The `transaction` helper (`packages/database/src/index.ts:21-43`) does the following:

- checks out one client;
- sets `lock_timeout = '5s'` (`:29`);
- commits or rolls back;
- releases the client with `discard = true` if `ROLLBACK` itself failed (`:41`), so a broken connection is not returned to the pool.

## Failure scenario

A cart contains two products. The first reserves successfully; the second is unavailable. Without the shared transaction, the first reservation leaks even though checkout failed. Forge rolls back the order, lines, reservations, intent and job together.

## Common junior mistake

Starting a transaction with `pool.query('BEGIN')` and then making unrelated `pool.query` calls. The pool may choose different connections. A transaction belongs to one connection.

## Production considerations

Keep transactions short. Sort resources consistently to reduce deadlocks. Bound lock/statement waits. Retry serialization/deadlock failures only when the entire operation has well-defined retry semantics. Inspect lock waits before increasing timeouts.

## Tradeoffs

Reserving before capture temporarily reduces availability. It avoids selling already-promised stock, but uncertain payments need reconciliation and a carefully designed expiry policy. Forge currently retains uncertain reservations; automatic expiry is a future requirement.

## Exercise

Run `npm test -- -t "competing purchase"`. Explain the two response statuses and why only one outbox row exists.

**Check:** your explanation names `201` for the winner and `409 INSUFFICIENT_STOCK` for the loser, and points at the `RETURNING warehouse_id` row count as the decision. Confirm it against the assertions in the test "allows exactly one competing purchase of the last item" in `tests/integration.test.ts`. Then run `npm test -- -t "coalesces concurrent retries"`, and explain which line of `checkout` makes the two same-key requests return one order.

## Debugging challenge

Use the multi-item rollback test. Move reservation outside the transaction in a temporary patch and describe which assertions should fail. Restore the code before proceeding.

## Interview questions

Does a transaction alone prevent overselling? Why is read-modify-write dangerous? How do optimistic versions differ from row locks? When does a database timeout leave a caller uncertain about a commit?

## Key takeaway

Put related writes in one transaction, and make the contested business condition part of the database write.
