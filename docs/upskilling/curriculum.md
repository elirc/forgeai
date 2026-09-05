# Curriculum

| Track                          | Initial material                                                               | Later applied work                                                |
| ------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Foundations and backend        | Request flow, validation, error codes and domain ownership                     | API versioning, scoped keys, contracts                            |
| Frontend                       | Task views, state ownership, bounded polling, accessible dialogs               | Query caching, optimistic UI, profiling                           |
| Databases                      | Constraints, transactions, conditional updates, snapshots, optimistic versions | Query plans, keyset pagination, migration upgrades, ledger        |
| Testing and debugging          | Real PostgreSQL API/concurrency tests, recovery fixture                        | Contract/E2E depth, performance regression                        |
| Architecture and system design | Modular monolith and explicit SQL ADRs                                         | Evidence-driven service extraction                                |
| Distributed systems            | Outbox command, leases, backoff, duplicate-safe effects                        | Fan-out, ordering, webhook delivery, consumer lag                 |
| Security                       | Sessions, membership, roles, CSRF and tenant references                        | RLS, least-privilege runtime roles, SSO, SSRF, uploads            |
| Observability and devops       | Structured requests and correlation, local startup                             | OpenTelemetry, SLOs, dashboards, restore drill, deployment        |
| AI engineering                 | Planned after domain actions and permissions stabilize                         | Tool contracts, persisted approvals, runs, RAG, evaluation        |
| Agentic engineering            | Manager loop, durable context, acceptance evidence                             | Real debugging records, parallel integration and agent evaluation |

A track being listed is not evidence that its later lessons exist. Add a lesson with its corresponding working feature and update the requirements register. The full target remains the master brief.
