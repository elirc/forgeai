# Risks and assumptions

- Initial customers are synthetic organizations with one warehouse and USD prices. Tax, shipping charges, multi-currency and backorders are excluded from the initial checkout policy, not from future product design.
- Login supports seeded local accounts. Self-service registration, SSO, MFA, invitations, account recovery and employee identity are separate requirements.
- The app currently uses a developer-owned database role and query-level tenant isolation plus composite keys. Production least privilege and RLS evaluation remain necessary.
- A durable PostgreSQL command queue is sufficient for the first workflow. It does not yet provide multi-consumer event fan-out.
- Uncertain payments keep stock reserved. Never add automatic release, cancellation or refund without a reconciliation-aware state machine.
- Provider state is stored in a simulator table outside the checkout transaction. This is a learning boundary; real network failures, signed callbacks and settlement require adapter/contract work.
- The browser persists a pending checkout attempt in session storage to reuse its key after response uncertainty. Synthetic customer data must not be confused with a finished retention/privacy policy.
- The embedded-postgres wrapper is explicitly prerelease-tagged; its bundled PostgreSQL 17.10 binaries are the database under test. Docker/managed PostgreSQL remain alternative environments.
- Local rate limiting is per API process. Multiple replicas require a shared enforcement strategy or edge limits.
- Notifications are tenant-wide in-app records in this slice. Individual preferences and external email/SMS/push delivery are future work.
- No production SLO, security certification, financial compliance, backup recovery or load capacity has been established.

- Same-origin browser traffic reaches Fastify through the Next.js loopback proxy, so current per-IP limits aggregate local browser clients. Production needs explicitly trusted forwarding or an edge rate-limiting policy.
- The local PostgreSQL wrapper force-stops its Windows process tree; PostgreSQL WAL recovery protects persistent demo data on restart. This is not evidence of a production graceful database shutdown or restore drill.
