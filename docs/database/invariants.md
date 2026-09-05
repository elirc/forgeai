# Database invariants and transaction boundaries

The authoritative schema is [001_foundation.sql](../../packages/database/migrations/001_foundation.sql).

## Tenant ownership

Products, orders, inventory, fulfillment, audit and jobs belong to a tenant. Composite foreign keys carry tenant ID through child references. A reservation cannot point to an order from Northstar and a warehouse from Harbor. API predicates still matter: constraints prevent invalid references, not unauthorized reads.

Row-level security is not enabled in this first slice. All application queries must include tenant predicates. Application DB permissions remain a production-hardening requirement; the local demo account owns the schema.

## Money and stock

Prices and totals use integer USD cents. Product prices are capped at 1,000,000 cents, quantities at 100, and checkouts at 20 distinct products, so an order total fits a PostgreSQL integer. Purchased price/name/SKU are snapshots.

```sql
UPDATE inventory
SET reserved = reserved + $3
WHERE tenant_id = $1 AND product_id = $2
  AND on_hand - reserved >= $3
RETURNING warehouse_id;
```

The actual function also selects the tenant's initial warehouse. A competing update waits on the row lock and PostgreSQL re-evaluates the predicate. Exactly one checkout can reserve the final item. Sorting products before locking reduces deadlock risk.

Constraints require `0 <= reserved <= on_hand`. Payment success keeps stock reserved. Shipment reduces on-hand and reserved together. Decline releases reserved stock. An order lock plus held/released/consumed reservation state prevents duplicate settlement.

## Checkout and uncertain external effects

One checked-out SQL client executes the transaction. It serializes the scoped idempotency key, checks a stored fingerprint, locks catalog rows, writes the order and snapshots, reserves inventory, creates a payment intent, writes the durable job, and audits. Any failure rolls back every write.

The provider call happens later, outside that transaction. A provider timeout keeps the order pending. It must not immediately release stock because a successful charge may already exist. Retry reuses the order ID as the provider key. Reservation expiry is not implemented yet; dead-letter pending payments need manual replay/reconciliation.

## Migrations

The runner obtains an advisory lock, checks checksums of applied migrations, and runs missing SQL in a transaction. Modifying an already applied migration is rejected. Add a new migration instead. Test both a fresh database and upgrades as further migrations arrive.

Current table sizes and indexes support the initial workload. Offset pagination is bounded but not optimal for large timelines; keyset pagination and EXPLAIN-based analysis are later exercises.
