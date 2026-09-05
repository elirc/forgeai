# Requirements register

The full target is [the master brief](../FORGE_MASTER_BUILD_PROMPT.md). This index preserves independently named capabilities across all domains. Implemented means source exists, not that all checks passed. Detailed acceptance for the current slice is below; expand future requirements before starting their milestone. No item is silently deferred or counted complete from a placeholder.

## Current-slice acceptance and evidence

| Area        | Acceptance criteria                                                                                                             | Source / verification                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Identity    | Correct login, failed-login throttling, expiry/logout revocation, removed membership immediately denied                         | identity service; identity integration tests |
| Tenancy     | Anonymous denied; foreign tenant lists/IDs/mutations denied; cross-tenant SQL references rejected                               | API guards, composite keys; boundary tests   |
| Catalog     | Validated product creation with stock/audit, fixed bounded pagination/search, stale version rejected                            | catalog service; catalog/database tests      |
| Checkout    | Server price snapshots, atomic stock reservation and outbox, last item sold once, equal keys coalesce, changed payload rejected | commerce/inventory; checkout tests           |
| Payments    | Simulated provider, repeated capture key returns same result, uncertainty stays pending and recovers                            | payment adapter; timeout/decline tests       |
| Worker      | Durable claims, lease fencing, bounded attempts/backoff, dead-letter replay audited                                             | jobs; crash/replay tests                     |
| Fulfillment | Only confirmed orders ship; duplicate shipments consume stock once                                                              | fulfillment; shipment tests                  |
| UI          | Login, catalog/create order/ship, role-appropriate actions, accessible dialogs and mobile layout                                | web components; Playwright flows             |
| Academy     | Code-linked explanations and three-level exercises, honest failure history                                                      | docs/upskilling; docs link audit             |

## Complete capability index

Evidence links: [source map](../architecture/repository-map.md), [test strategy](../testing/strategy.md), [verification record](verification.md), [learning path](../upskilling/learning-path.md).

### Identity & tenancy

| ID    | Capability                             | Target milestone | Status                    |
| ----- | -------------------------------------- | ---------------- | ------------------------- |
| ID-01 | organization model                     | 1                | Verified in initial slice |
| ID-02 | user credential model                  | 1                | Verified in initial slice |
| ID-03 | tenant memberships                     | 1                | Verified in initial slice |
| ID-04 | roles and authorization                | 1                | Verified in initial slice |
| ID-05 | revocable sessions                     | 1                | Verified in initial slice |
| ID-06 | cross-tenant read isolation            | 1                | Verified in initial slice |
| ID-07 | cross-tenant reference integrity       | 1                | Verified in initial slice |
| ID-08 | team management                        | 1                | Planned                   |
| ID-09 | self-service organization provisioning | 1                | Planned                   |
| ID-10 | user invitations and recovery          | 1                | Planned                   |
| ID-11 | SSO and MFA                            | 1                | Planned                   |
| ID-12 | ABAC policy evaluation                 | 1                | Planned                   |
| ID-13 | scoped API keys                        | 1                | Planned                   |
| ID-14 | audit logging                          | 1                | Verified in initial slice |

### Commerce

| ID     | Capability              | Target milestone | Status                    |
| ------ | ----------------------- | ---------------- | ------------------------- |
| COM-01 | products                | 2                | Verified in initial slice |
| COM-02 | product variants        | 2                | Planned                   |
| COM-03 | categories              | 2                | Planned                   |
| COM-04 | pricing                 | 2                | Verified in initial slice |
| COM-05 | carts                   | 2                | Planned                   |
| COM-06 | atomic checkout         | 2                | Verified in initial slice |
| COM-07 | order lifecycle         | 2                | Verified in initial slice |
| COM-08 | price snapshots         | 2                | Verified in initial slice |
| COM-09 | idempotent checkout     | 2                | Verified in initial slice |
| COM-10 | discounts               | 2                | Planned                   |
| COM-11 | refunds                 | 2                | Planned                   |
| COM-12 | returns                 | 2                | Planned                   |
| COM-13 | tax and shipping policy | 2                | Planned                   |

### Payments & billing

| ID     | Capability                  | Target milestone | Status                    |
| ------ | --------------------------- | ---------------- | ------------------------- |
| PAY-01 | provider abstraction        | 5                | Verified in initial slice |
| PAY-02 | payment intents             | 5                | Verified in initial slice |
| PAY-03 | payment state machine       | 5                | Verified in initial slice |
| PAY-04 | provider idempotency        | 5                | Verified in initial slice |
| PAY-05 | uncertain payment recovery  | 5                | Verified in initial slice |
| PAY-06 | signed inbound webhooks     | 5                | Planned                   |
| PAY-07 | out-of-order webhooks       | 5                | Planned                   |
| PAY-08 | invoices                    | 5                | Planned                   |
| PAY-09 | subscriptions               | 5                | Planned                   |
| PAY-10 | refund processing           | 5                | Planned                   |
| PAY-11 | balanced append-only ledger | 5                | Planned                   |
| PAY-12 | reconciliation cases        | 5                | Planned                   |

### Inventory

| ID     | Capability                      | Target milestone | Status                    |
| ------ | ------------------------------- | ---------------- | ------------------------- |
| INV-01 | warehouses                      | 5                | Verified in initial slice |
| INV-02 | stock balances                  | 5                | Verified in initial slice |
| INV-03 | atomic reservations             | 5                | Verified in initial slice |
| INV-04 | concurrent allocation           | 5                | Verified in initial slice |
| INV-05 | reservation settlement          | 5                | Verified in initial slice |
| INV-06 | reservation expiry              | 5                | Planned                   |
| INV-07 | adjustments                     | 5                | Planned                   |
| INV-08 | transfers                       | 5                | Planned                   |
| INV-09 | stock movement history          | 5                | Verified in initial slice |
| INV-10 | low-stock conditions            | 5                | Verified in initial slice |
| INV-11 | multi-warehouse allocation      | 5                | Planned                   |
| INV-12 | replenishment and supplier data | 5                | Planned                   |

### Fulfillment

| ID     | Capability                    | Target milestone | Status                    |
| ------ | ----------------------------- | ---------------- | ------------------------- |
| FUL-01 | shipment preparation          | 3                | Verified in initial slice |
| FUL-02 | fulfillment state machine     | 3                | Verified in initial slice |
| FUL-03 | duplicate-safe shipping       | 3                | Verified in initial slice |
| FUL-04 | tracking                      | 3                | Planned                   |
| FUL-05 | shipping provider abstraction | 3                | Planned                   |
| FUL-06 | partial fulfillment           | 3                | Planned                   |
| FUL-07 | returns                       | 3                | Planned                   |
| FUL-08 | exchanges                     | 3                | Planned                   |

### CRM

| ID     | Capability                   | Target milestone | Status  |
| ------ | ---------------------------- | ---------------- | ------- |
| CRM-01 | accounts                     | 4                | Planned |
| CRM-02 | contacts                     | 4                | Planned |
| CRM-03 | leads                        | 4                | Planned |
| CRM-04 | opportunities                | 4                | Planned |
| CRM-05 | activity timelines           | 4                | Planned |
| CRM-06 | customer/order relationships | 4                | Planned |

### Support

| ID     | Capability                     | Target milestone | Status  |
| ------ | ------------------------------ | ---------------- | ------- |
| SUP-01 | tickets                        | 4                | Planned |
| SUP-02 | comments                       | 4                | Planned |
| SUP-03 | queues                         | 4                | Planned |
| SUP-04 | priorities                     | 4                | Planned |
| SUP-05 | assignment                     | 4                | Planned |
| SUP-06 | SLA tracking                   | 4                | Planned |
| SUP-07 | escalation                     | 4                | Planned |
| SUP-08 | secure attachments             | 4                | Planned |
| SUP-09 | customer/order/payment context | 4                | Planned |

### Engineering management

| ID     | Capability        | Target milestone | Status  |
| ------ | ----------------- | ---------------- | ------- |
| PRJ-01 | projects          | 4                | Planned |
| PRJ-02 | issues            | 4                | Planned |
| PRJ-03 | tasks             | 4                | Planned |
| PRJ-04 | statuses          | 4                | Planned |
| PRJ-05 | dependencies      | 4                | Planned |
| PRJ-06 | iterations        | 4                | Planned |
| PRJ-07 | comments          | 4                | Planned |
| PRJ-08 | incidents         | 4                | Planned |
| PRJ-09 | remediation links | 4                | Planned |

### Workforce

| ID     | Capability            | Target milestone | Status  |
| ------ | --------------------- | ---------------- | ------- |
| WRK-01 | employees             | 4                | Planned |
| WRK-02 | onboarding            | 4                | Planned |
| WRK-03 | teams                 | 4                | Planned |
| WRK-04 | internal permissions  | 4                | Planned |
| WRK-05 | operational tasks     | 4                | Planned |
| WRK-06 | operational workflows | 4                | Planned |

### Notifications

| ID     | Capability               | Target milestone | Status                    |
| ------ | ------------------------ | ---------------- | ------------------------- |
| NOT-01 | in-app outcomes          | 3                | Verified in initial slice |
| NOT-02 | email adapter            | 3                | Planned                   |
| NOT-03 | SMS abstraction          | 3                | Planned                   |
| NOT-04 | push abstraction         | 3                | Planned                   |
| NOT-05 | preferences              | 3                | Planned                   |
| NOT-06 | versioned templates      | 3                | Planned                   |
| NOT-07 | bounded delivery retries | 3                | Planned                   |
| NOT-08 | delivery history         | 3                | Planned                   |

### Workflow automation

| ID     | Capability                   | Target milestone | Status  |
| ------ | ---------------------------- | ---------------- | ------- |
| WFL-01 | trigger schemas              | 6                | Planned |
| WFL-02 | validated conditions         | 6                | Planned |
| WFL-03 | allowlisted actions          | 6                | Planned |
| WFL-04 | versioned definitions        | 6                | Planned |
| WFL-05 | durable runs                 | 6                | Planned |
| WFL-06 | execution-time authorization | 6                | Planned |
| WFL-07 | bounded retries              | 6                | Planned |
| WFL-08 | execution history            | 6                | Planned |
| WFL-09 | cancellation                 | 6                | Planned |
| WFL-10 | safe replay                  | 6                | Planned |
| WFL-11 | loop prevention              | 6                | Planned |
| WFL-12 | execution budgets            | 6                | Planned |

### Analytics

| ID     | Capability              | Target milestone | Status                    |
| ------ | ----------------------- | ---------------- | ------------------------- |
| ANA-01 | event collection        | 6                | Planned                   |
| ANA-02 | versioned event schemas | 6                | Planned                   |
| ANA-03 | operational dashboard   | 6                | Verified in initial slice |
| ANA-04 | reporting               | 6                | Planned                   |
| ANA-05 | funnels                 | 6                | Planned                   |
| ANA-06 | freshness semantics     | 6                | Planned                   |
| ANA-07 | deduplication           | 6                | Planned                   |
| ANA-08 | tenant-safe aggregation | 6                | Planned                   |

### Observability

| ID     | Capability                | Target milestone | Status                    |
| ------ | ------------------------- | ---------------- | ------------------------- |
| OBS-01 | structured request logs   | 9                | Verified in initial slice |
| OBS-02 | server request IDs        | 9                | Verified in initial slice |
| OBS-03 | cross-process correlation | 9                | Verified in initial slice |
| OBS-04 | metrics                   | 9                | Planned                   |
| OBS-05 | OpenTelemetry traces      | 9                | Planned                   |
| OBS-06 | dashboards                | 9                | Planned                   |
| OBS-07 | alerts                    | 9                | Planned                   |
| OBS-08 | SLIs and SLOs             | 9                | Planned                   |
| OBS-09 | error reporting           | 9                | Planned                   |
| OBS-10 | retention and redaction   | 9                | Planned                   |

### Developer platform

| ID     | Capability               | Target milestone | Status                    |
| ------ | ------------------------ | ---------------- | ------------------------- |
| DEV-01 | REST resources           | 6                | Verified in initial slice |
| DEV-02 | runtime validation       | 6                | Verified in initial slice |
| DEV-03 | pagination               | 6                | Verified in initial slice |
| DEV-04 | filtering                | 6                | Verified in initial slice |
| DEV-05 | sorting                  | 6                | Verified in initial slice |
| DEV-06 | stable error contract    | 6                | Verified in initial slice |
| DEV-07 | OpenAPI contract         | 6                | Planned                   |
| DEV-08 | versioning policy        | 6                | Planned                   |
| DEV-09 | API keys                 | 6                | Planned                   |
| DEV-10 | rate limiting            | 6                | Verified in initial slice |
| DEV-11 | webhook subscriptions    | 6                | Planned                   |
| DEV-12 | delivery signatures      | 6                | Planned                   |
| DEV-13 | bounded delivery retries | 6                | Planned                   |
| DEV-14 | SDK example              | 6                | Planned                   |

### AI platform

| ID    | Capability                   | Target milestone | Status  |
| ----- | ---------------------------- | ---------------- | ------- |
| AI-01 | provider interface           | 7                | Planned |
| AI-02 | deterministic local provider | 7                | Planned |
| AI-03 | structured output validation | 7                | Planned |
| AI-04 | tool contracts               | 7                | Planned |
| AI-05 | bounded agent runs           | 7                | Planned |
| AI-06 | human approvals              | 7                | Planned |
| AI-07 | approval expiry and fencing  | 7                | Planned |
| AI-08 | inspectable steps            | 7                | Planned |
| AI-09 | token accounting             | 7                | Planned |
| AI-10 | cost accounting              | 7                | Planned |
| AI-11 | prompt versions              | 7                | Planned |
| AI-12 | run cancellation             | 7                | Planned |
| AI-13 | run recovery                 | 7                | Planned |
| AI-14 | RAG access filtering         | 7                | Planned |
| AI-15 | provenance and citations     | 7                | Planned |
| AI-16 | injection defenses           | 7                | Planned |
| AI-17 | support agent                | 7                | Planned |
| AI-18 | incident agent               | 7                | Planned |
| AI-19 | inventory agent              | 7                | Planned |
| AI-20 | finance agent                | 7                | Planned |
| AI-21 | Agent Operations UI          | 7                | Planned |

### AI evaluation

| ID      | Capability                       | Target milestone | Status  |
| ------- | -------------------------------- | ---------------- | ------- |
| EVAL-01 | versioned golden datasets        | 7                | Planned |
| EVAL-02 | deterministic outcome assertions | 7                | Planned |
| EVAL-03 | tool selection checks            | 7                | Planned |
| EVAL-04 | structured output checks         | 7                | Planned |
| EVAL-05 | authorization regression         | 7                | Planned |
| EVAL-06 | adversarial fixtures             | 7                | Planned |
| EVAL-07 | rubric calibration               | 7                | Planned |
| EVAL-08 | latency measurement              | 7                | Planned |
| EVAL-09 | cost measurement                 | 7                | Planned |
| EVAL-10 | failure rates                    | 7                | Planned |
| EVAL-11 | live-provider separation         | 7                | Planned |
| EVAL-12 | regression budgets               | 7                | Planned |

### Failure engineering

| ID       | Capability                    | Target milestone | Status                            |
| -------- | ----------------------------- | ---------------- | --------------------------------- |
| CHAOS-01 | development-only backend gate | 8                | Verified in initial slice         |
| CHAOS-02 | tenant-scoped expiring rules  | 8                | Verified in initial slice         |
| CHAOS-03 | payment decline               | 8                | Verified in initial slice         |
| CHAOS-04 | payment provider 500          | 8                | Verified in initial slice         |
| CHAOS-05 | timeout after capture         | 8                | Verified in initial slice         |
| CHAOS-06 | duplicate webhook             | 8                | Planned                           |
| CHAOS-07 | out-of-order webhook          | 8                | Planned                           |
| CHAOS-08 | inventory timeout             | 8                | Planned                           |
| CHAOS-09 | Redis unavailable             | 8                | Planned                           |
| CHAOS-10 | worker crash                  | 8                | Implemented; verification pending |
| CHAOS-11 | deadlock                      | 8                | Planned                           |
| CHAOS-12 | message failure               | 8                | Planned                           |
| CHAOS-13 | consumer lag                  | 8                | Planned                           |
| CHAOS-14 | notification outage           | 8                | Planned                           |
| CHAOS-15 | external rate limit           | 8                | Planned                           |
| CHAOS-16 | malformed LLM output          | 8                | Planned                           |
| CHAOS-17 | LLM timeout                   | 8                | Planned                           |
| CHAOS-18 | agent tool failure            | 8                | Planned                           |
| CHAOS-19 | duplicate event               | 8                | Planned                           |
| CHAOS-20 | stale version update          | 8                | Verified in initial slice         |
| CHAOS-21 | retry backoff and jitter      | 8                | Verified in initial slice         |
| CHAOS-22 | dead letters                  | 8                | Verified in initial slice         |
| CHAOS-23 | lease fencing                 | 8                | Verified in initial slice         |

### Operations and performance

| ID     | Capability                        | Target milestone | Status                            |
| ------ | --------------------------------- | ---------------- | --------------------------------- |
| OPS-01 | local reproducible setup          | 9                | Verified in initial slice         |
| OPS-02 | Docker Compose                    | 9                | Implemented; verification pending |
| OPS-03 | configuration validation          | 9                | Verified in initial slice         |
| OPS-04 | CI workflow                       | 9                | Implemented; verification pending |
| OPS-05 | migration checksums               | 9                | Verified in initial slice         |
| OPS-06 | migration upgrade checks          | 9                | Planned                           |
| OPS-07 | health and readiness              | 9                | Verified in initial slice         |
| OPS-08 | graceful shutdown                 | 9                | Implemented; verification pending |
| OPS-09 | backup and restore drill          | 9                | Planned                           |
| OPS-10 | runtime least privilege           | 9                | Planned                           |
| OPS-11 | deployment architecture           | 9                | Planned                           |
| OPS-12 | load baseline                     | 9                | Planned                           |
| OPS-13 | query plan analysis               | 9                | Planned                           |
| OPS-14 | frontend profiling                | 9                | Planned                           |
| OPS-15 | cache analysis                    | 9                | Planned                           |
| OPS-16 | worker throughput                 | 9                | Planned                           |
| OPS-17 | service extraction ADR            | 9                | Planned                           |
| OPS-18 | comparative extraction deployment | 9                | Planned                           |

### Engineering Academy

| ID     | Capability                     | Target milestone | Status                    |
| ------ | ------------------------------ | ---------------- | ------------------------- |
| ACA-01 | learning path                  | 1                | Verified in initial slice |
| ACA-02 | curriculum                     | 1                | Verified in initial slice |
| ACA-03 | glossary                       | 1                | Verified in initial slice |
| ACA-04 | tenant isolation lesson        | 1                | Verified in initial slice |
| ACA-05 | transaction lesson             | 1                | Verified in initial slice |
| ACA-06 | durable job lesson             | 1                | Verified in initial slice |
| ACA-07 | manager loop lesson            | 1                | Verified in initial slice |
| ACA-08 | junior exercises               | 1                | Verified in initial slice |
| ACA-09 | mid-level exercises            | 1                | Verified in initial slice |
| ACA-10 | advanced exercises             | 1                | Verified in initial slice |
| ACA-11 | code-reading tasks             | 1                | Verified in initial slice |
| ACA-12 | reproducible debugging labs    | 1                | Verified in initial slice |
| ACA-13 | real agent debugging records   | 1                | Verified in initial slice |
| ACA-14 | AI engineering lessons         | 1                | Planned                   |
| ACA-15 | parallel agent curriculum      | 1                | Planned                   |
| ACA-16 | context engineering curriculum | 1                | Planned                   |
| ACA-17 | review checklists              | 1                | Verified in initial slice |
| ACA-18 | learner capstone               | 1                | Planned                   |

## Scope notes

The initial catalog stores a category label, not a category-management domain. The cart is browser state, not a persisted cart model. Simulated shipping references do not fulfill the carrier integration requirement. Initial source for local startup, cleanup, Compose and CI must be verified in each target environment before its operational behavior is claimed. Expired-worker recovery is an executable controlled test; a general process-crash Chaos UI is separate future work.
