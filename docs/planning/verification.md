# Verification record

Environment: Windows, Node.js 24.19.0, npm 11.17.0, PostgreSQL 17.10 through the pinned embedded-postgres wrapper. Recorded on 2026-09-04.

| Check                                       | Observed result                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime/development dependency installation | Passed; exact versions and integrity hashes in package-lock.json                                                                       |
| `npm test`                                  | **22 PostgreSQL/API tests passed**, including direct domain role guards and canonical UUID casing                                      |
| `npm run test:e2e`                          | **3 Chromium journeys passed**; final fixture shutdown clean                                                                           |
| `npm run build`                             | Passed; final backend and web bundles include the notification, mobile and contrast changes                                            |
| `npm run typecheck`                         | Passed; route types now generated before checking backend, scripts/tests and web                                                       |
| `npm run lint`                              | Passed with zero warnings                                                                                                              |
| `npm run format:check`                      | Passed; final documentation formatted and checked                                                                                      |
| `npm run docs:check`                        | Passed across 32 Markdown files                                                                                                        |
| `npm audit --omit=dev`                      | Zero reported runtime vulnerabilities at verification time                                                                             |
| Desktop/mobile visual inspection            | Screenshots inspected; mobile test corrected to wait for data rather than capturing a loading screen                                   |
| Keyboard/role checks                        | Native dialog Escape dismissal and hidden mutation controls verified in browser                                                        |
| Focused contrast check                      | Primary button adjusted to approximately 4.87:1; several muted text colors darkened. This is not a full accessibility certification    |
| Development logger smoke                    | Built API with non-silent logging returned health 200                                                                                  |
| Default `npm run dev` quickstart            | Passed: fresh persistent database initialized/seeded, API health/readiness and web returned 200; browser login/dashboard/logout passed |
| Docker Compose                              | Not run: Docker unavailable in this environment                                                                                        |
| GitHub Actions                              | Authored using official current action usage; not run remotely                                                                         |
| Live providers / production deployment      | Not attempted; payments and shipping are simulations                                                                                   |

## Behavioral coverage

The database suite checks membership removal, anonymous/cross-tenant requests, viewer/operator restrictions, login limits, expired/revoked sessions, validation, literal SQL search, stale versions, composite foreign keys, stock constraints, migration idempotency, rollback, UUID canonicalization, price snapshots, competing last-item purchases, concurrent retry keys, multi-item rollback, payment success/decline/uncertainty, lease fencing, bounded dead-letter recovery and repeated shipment.

The browser suite drives the real UI against an isolated PostgreSQL/API/worker fixture. It checks persisted effects, not static mock screens. Test databases are freshly allocated, then stopped and removed. The development database is never used as a test fallback.

## Environment findings

A restricted Windows token caused `os.userInfo()` failures in native tooling before tests began. The successful runtime tests used normal process permissions and workspace-local data. The first setup failure is not counted as a passing test run.

The local PostgreSQL wrapper publishes prerelease npm tags; `17.10.0-beta.17` wraps PostgreSQL 17.10. Native setup scripts are pinned in `allowScripts`. The linter stays on ESLint 9 because the installed React plugin's peer range excludes ESLint 10; forced incompatible dependency resolution was rejected.

Current evidence does not establish production throughput, SLO attainment, disaster recovery, regulatory compliance, full accessibility, or correct behavior of any real payment provider.
