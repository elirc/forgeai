# Delivery roadmap

The full scope is in [the master brief](../FORGE_MASTER_BUILD_PROMPT.md). Requirements are tracked separately from milestone status.

| Milestone | Outcome                                                                        | Current status                                                       |
| --------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 0         | Revised brief, stack decisions, boundaries and first-slice criteria            | Implemented                                                          |
| 1         | Reproducible app, identity, two tenants, catalog and meaningful verification   | Initial slice verified; see verification limits                      |
| 2         | Checkout, price snapshots, reservations and transactional outbox               | Initial slice verified; see verification limits                      |
| 3         | Durable worker, simulated payments, fulfillment and notifications              | Payment/fulfillment subset verified; general fan-out remains planned |
| 4         | CRM, support, workforce and project/incident operations                        | Planned                                                              |
| 5         | Ledger, refunds/returns, reconciliation, inventory depth and billing           | Planned                                                              |
| 6         | Workflows, analytics and developer platform                                    | Planned                                                              |
| 7         | AI execution, persisted approvals, support agent, evaluations and UI           | Planned                                                              |
| 8         | Additional agents, retrieval and broader chaos coverage                        | Planned                                                              |
| 9         | Operational/security hardening, tracing, restore, load and deployment evidence | Planned; basic controls begin in current slice                       |
| 10        | Evidence-driven extraction and final requirement/Academy audit                 | Planned                                                              |

Do not equate the first three milestones' partial implementation with the complete program. Before a later slice starts, expand its acceptance criteria and dependencies into executable tasks. Production migrations, unsafe compensation and AI mutations require domain-specific failure tests.
