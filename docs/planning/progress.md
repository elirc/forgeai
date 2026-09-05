# Progress

## Delivered checkpoint: connected commerce foundation

The master prompt now lives at `docs/FORGE_MASTER_BUILD_PROMPT.md`. Its change-summary link was updated before application implementation.

The working slice includes:

- Next.js workspace UI and an Academy landing page.
- Fastify API with Argon2id credentials, revocable opaque sessions, tenant membership and admin/operator/viewer policies.
- Two synthetic organizations and four local accounts.
- Validated product creation, opening stock/movements, search/pagination and optimistic API updates.
- Checkout with canonical UUIDs, server price snapshots, durable scoped idempotency, atomic reservations and outbox command.
- PostgreSQL worker claims, expiring leases, fencing, bounded retry/backoff, dead letters and audited replay.
- Simulated payment success/decline/timeout-after-capture, duplicate-safe fulfillment and inventory settlement.
- Tenant-wide in-app notifications, audit history, operational counts and a gated five-minute failure console.
- Code-linked Academy lessons, three exercise levels, a code-reading tour and reproducible failure labs.

## Verification

The final PostgreSQL suite passed **22 tests**. The final browser suite passed **3 journeys**, covering product → checkout → payment → shipment → inventory → notification, role restrictions, keyboard dismissal, loaded mobile layout, mobile sign-out and Academy navigation. The fixture now shuts down its worker/API/pool before PostgreSQL; the final browser run had no database-disconnect errors.

The final production build, strict TypeScript, lint, formatting and local Markdown link checks passed. The documented default development startup also passed a fresh-database and real-browser smoke check. Forge was left running at http://localhost:3000. The final verification commands and remaining environment limitations are recorded in [verification.md](verification.md).

## Scope still open

This is the first working slice, not the complete enterprise program. CRM, support, workforce/projects, ledger/refunds, subscriptions, a general workflow engine, public developer APIs, domain AI agents/evaluations, OpenTelemetry, backup/restore, load testing and service extraction remain planned. Reservation expiry and uncertain-payment cancellation need a reconciliation-aware design.

## Next bounded work

1. Add typed order-detail/line/payment/fulfillment reads and customer/contact ownership.
2. Add a tenant-scoped support ticket linked to an order, with immutable activity and role tests.
3. Introduce a general outbox envelope and separate consumer effects once the second subscriber provides a concrete need.
4. Design versioned AI tool contracts and persisted approval semantics over those verified domain operations.

The broader target remains in the requirements register. Do not relabel future work as complete because the UI is polished or the first tests pass.
