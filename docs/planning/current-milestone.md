# Current milestone checkpoint

The first tenant-isolated commerce slice has been implemented and exercised through PostgreSQL and browser tests. See [verification](verification.md) for exact results, including the passed default startup/browser smoke check.

## Acceptance delivered

1. Next.js, Fastify, actual PostgreSQL, migrations, deterministic seeds and a worker share a documented local setup.
2. Two tenants and four accounts demonstrate authenticated admin/operator/viewer behavior and denied cross-tenant access.
3. Catalog creation/search/pagination/versioned update use validation, authorization and audit records.
4. Checkout snapshots prices, reserves stock atomically, persists an outbox command and safely handles repeated request keys.
5. A simulated payment worker confirms or declines orders, supports uncertain-outcome recovery and creates notification/fulfillment records.
6. PostgreSQL tests exercise constraints, concurrency, rollback, revoked sessions, direct domain guards and repeated effects.
7. The UI exposes persisted orders, stock, notifications, activity and job state; sensitive controls are role-gated.
8. Academy lessons explain the actual auth/checkout/recovery paths and provide verifiable exercises.

## Next slice: customer-linked support

Before implementation, define a tenant-owned customer/contact model and a support ticket referencing an order. Acceptance must include tenant-safe foreign keys, role checks at HTTP/domain boundaries, ticket activity history, order detail snapshots and a meaningful browser flow. This creates the domain context needed for the later support agent.

The complete enterprise program is still open. Do not mark Milestones 3–10 complete from this checkpoint.
