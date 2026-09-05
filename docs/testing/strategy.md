# Testing strategy

`npm test` starts a fresh actual PostgreSQL cluster on an available loopback port using `tests/global-setup.ts`. It applies the real migrations and passes the URL to Vitest. Tests truncate only that freshly allocated fixture cluster. The local development database is never selected as a fallback.

The integration suite exercises authentication, denied tenant/role access, expired/revoked sessions, input validation, literal SQL search, version conflicts, composite foreign keys, constraints, transaction rollback, checkout atomicity, concurrent last-item purchase, concurrent duplicate requests, payment decline, timeout after capture, lease fencing, replay and duplicate shipment.

Competing requests use separate pool connections. Database locks, rather than sleeps, synchronize conflicting operations. Retry tests explicitly make persisted jobs due; they do not wait through backoff intervals.

`npm run typecheck` checks backend/scripts/tests and the Next.js project. `npm run lint` checks TypeScript and React. `npm run build` emits backend JavaScript and a production Next.js bundle. Formatter verification is separate.

Browser tests use Playwright and the application's public UI. Install the browser with `npx playwright install chromium` if needed. The fixture uses its own database and ports; see the Playwright configuration. Test that sign-in, product creation, checkout and shipment change actual application state.

Current verification results belong in [verification.md](../planning/verification.md), not inferred from the existence of tests. PostgreSQL adapter tests do not prove behavior of a real external payment provider. CI execution is unverified until run on the target runner.

CI action majors follow the official [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), and [upload-artifact](https://github.com/actions/upload-artifact) usage documentation checked at implementation time. Checkout does not persist credentials. Remote CI has not been run in this workspace.

The E2E fixture has a loopback-only authenticated shutdown endpoint in the test harness, not the application API. Global teardown waits for worker/API/pool/database cleanup before Playwright disposes of the process.
