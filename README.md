# Forge

An evolving, multi-tenant commerce and operations platform, built alongside the Forge Engineering Academy.

The current slice connects authentication, a tenant-scoped catalog, checkout, inventory reservations, simulated payment processing, fulfillment, notifications, audit history, and a development failure console. The [master brief](docs/FORGE_MASTER_BUILD_PROMPT.md) is the full program; many later domains remain planned. See [delivery status](docs/planning/progress.md) for evidence and limits.

## Start locally

Use Node.js 24 and npm. Run all commands from the repository root.

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. The development runner starts a real local PostgreSQL cluster if the default database is unavailable, applies migrations, seeds synthetic data, and starts the API, worker, and web app. Initial setup downloads platform-specific PostgreSQL binaries through npm. It requires no paid accounts. Local files stay in `.local/` and `.cache/`.

| Account                    | Role     | Workspace        |
| -------------------------- | -------- | ---------------- |
| alex@northstar.example     | Admin    | Northstar Supply |
| operator@northstar.example | Operator | Northstar Supply |
| viewer@northstar.example   | Viewer   | Northstar Supply |
| owner@harbor.example       | Admin    | Harbor Goods     |

All local demo accounts use **Forge-demo-2026!**. These publicly documented credentials belong only in synthetic development environments. The demo runner and seeder refuse production mode.

Use `.env.example` as a starting point for a local `.env`. An explicitly supplied `DATABASE_URL` is used as-is; the runner never replaces an unreachable custom database with the demo database.

### Docker alternative

```sh
docker compose up -d
npm run dev
```

Compose binds PostgreSQL to loopback on port 54329. When using a database already running, the demo runner does not own or stop it.

### Run components separately

```sh
npm run db:local
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev:worker
npm run dev:web
```

Run long-lived commands in separate terminals. API: port 4000. Web: port 3000. Stop the development runner with Ctrl+C.

## Try a connected workflow

1. Sign in as Alex. Open Products and add one or more items to an order.
2. Enter a synthetic customer name/email and create the order.
3. Observe payment pending, followed by ready to ship after the worker runs. Use Refresh if needed; polling runs every 15 seconds.
4. Ship the order. Inventory reduces on hand and releases the corresponding reservation.
5. Inspect Activity and Operations. Follow the same correlation ID across the checkout and payment outcome.

No money is charged and no carrier is contacted. The UI explicitly identifies the simulated providers.

To reproduce an uncertain payment, set `CHAOS_ENABLED=true`, restart the API and worker, and select “Timeout after successful charge” in Operations. The first attempt records a provider payment but loses its response; a retry retrieves the same payment and confirms the order. See the [failure recovery runbook](docs/runbooks/payment-recovery.md).

## Engineering checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run format:check
```

`npm test` creates and stops a fresh real PostgreSQL cluster. It never truncates the development database. Browser tests have their own local application/database fixture; see [testing](docs/testing/strategy.md) for browser setup and environment limitations.

## Read and learn

- [Architecture and repository map](docs/architecture/repository-map.md)
- [Database invariants](docs/database/invariants.md)
- [API guide](docs/api/README.md)
- [Academy learning path](docs/upskilling/learning-path.md)
- [Requirement register](docs/planning/requirements.md)
- [Verification record](docs/planning/verification.md)

## Current boundaries

The initial allocation policy uses one warehouse per tenant, USD cents, one-time simulated payments, and no tax/shipping charges. Pending payments retain reservations until a definitive outcome; uncertain dead-letter cases require recovery rather than unsafe automatic stock release. Enterprise SSO, self-service provisioning, reservation expiry, payment webhooks, refunds/ledger, additional business domains, domain AI agents, OpenTelemetry, and service extraction have separate tracked requirements. Do not deploy the demo configuration as production.
