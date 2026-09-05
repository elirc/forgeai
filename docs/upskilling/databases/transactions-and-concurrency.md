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

```sql
UPDATE inventory
SET reserved = reserved + $3
WHERE tenant_id=$1 AND product_id=$2
  AND on_hand-reserved >= $3;
```

The actual query also restricts the initial warehouse. Under PostgreSQL's default READ COMMITTED isolation, a conflicting updater waits and rechecks the condition against the updated row. No returned row means insufficient stock.

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

## Debugging challenge

Use the multi-item rollback test. Move reservation outside the transaction in a temporary patch and describe which assertions should fail. Restore the code before proceeding.

## Interview questions

Does a transaction alone prevent overselling? Why is read-modify-write dangerous? How do optimistic versions differ from row locks? When does a database timeout leave a caller uncertain about a commit?

## Key takeaway

Put related writes in one transaction, and make the contested business condition part of the database write.
