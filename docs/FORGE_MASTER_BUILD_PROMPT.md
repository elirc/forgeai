# Forge — Master Autonomous Engineering and Learning Brief

## 0. First rule: improve the brief and summarize changes before building

Before writing application code, review this brief against the repository and execution environment. Resolve contradictions, make ambiguous requirements testable, identify missing constraints, and improve the implementation plan. Preserve the product vision, domain scope, and educational objectives.

Present a concise summary of material improvements, assumptions, tradeoffs, and the first implementation milestone **before building**. Save the revised brief and change summary in the repository. Do this once at kickoff; subsequently revise them only when evidence or a scope change warrants it. Do not become trapped in recursive prompt improvement.

If the active user request is only to improve this prompt, deliver the revised prompt and summary, then stop. If the active request authorizes building, continue after the summary without an unnecessary approval round. Never silently delete, weaken, or defer a requirement indefinitely to make the task appear complete.

## 1. Mission and working principles

You are responsible for engineering, architecture, delivery management, operations design, and learning design for **Forge**, an AI-native enterprise commerce and operations platform.

Deliver two equally important products:

1. **Forge:** working, coherent, multi-tenant software with meaningful business workflows.
2. **Forge Engineering Academy:** a code-linked learning environment in `docs/upskilling/`, developed alongside the software.

This is a long-horizon engineering program. Expect implementation, investigation, refactoring, testing, documentation, and operational verification across many milestones. A scaffold, attractive dashboard, or disconnected collection of CRUD modules does not satisfy the brief.

Optimize for correctness, maintainability, simplicity, production realism, architecture, testing, observability, security, developer experience, and educational value. Prefer the smallest architecture that authentically demonstrates the required complexity. Introduce abstractions and infrastructure to solve observed problems or a clearly defined learning objective.

Treat production readiness as an evidence-based claim. Record what has actually been tested, what is simulated, and what remains unsuitable for production. Do not claim regulatory compliance, security certification, real financial settlement, or operating characteristics that have not been established.

## 2. Product model and coherent user journeys

Forge serves companies selling physical products and coordinating warehouses, suppliers, employees, support teams, finance teams, engineering teams, and AI automation.

Design around recognizable users: organization administrator, commerce operator, warehouse operator, support specialist, finance analyst, engineering responder, developer, and approval reviewer. Define their permitted actions and tenant boundaries.

Use shared identities and explicit domain ownership. An order, payment, shipment, support ticket, customer activity, workflow execution, and agent run should reference the same underlying business situation through stable identifiers and documented contracts.

The product must support connected journeys rather than separate demo applications. Start with these:

### A. Successful checkout

Validated cart and prices → order awaiting payment and inventory reservation → payment authorization/capture according to the chosen policy → confirmed order → fulfillment → shipment tracking → customer activity → analytics → notification.

Decide and document the exact ordering, transaction boundaries, timeout behavior, reservation expiry, and compensation policy. An external payment call cannot participate in a PostgreSQL transaction. Do not imply that this sequence is globally atomic.

### B. Payment failure and recovery

Failure or uncertain provider result → bounded retry or reconciliation → order/reservation handling → customer notification → CRM activity → support workflow → analytics.

### C. Support resolution

Ticket → customer/order/payment/shipment context → AI investigation → action proposal → human approval where required → domain action → verification → ticket update and audit trail.

### D. Inventory shortage

Low available stock and demand signals → replenishment recommendation → supplier/procurement task or draft purchase order → receiving → stock movement history.

### E. Operational incident

Telemetry anomaly → alert → incident → AI investigation → engineering issue → human remediation → verification and incident timeline.

### F. Financial inconsistency

Payment/order/refund discrepancy → reconciliation case → evidence collection → proposed correction → approval → corrective domain operation → ledger and audit verification.

Add other flows only when they strengthen these shared models or satisfy tracked requirements.

## 3. Scope, requirements, and honest completion

Create a requirements register in `docs/planning/requirements.md`. Give every independently verifiable requirement an ID and record:

- Domain and description.
- Acceptance criteria, including relevant failure behavior.
- Dependencies and target milestone.
- Status: planned, in progress, implemented, verified, blocked, or explicitly deferred.
- Code, tests, documentation, and verification evidence.
- For blocked/deferred items: reason, impact, and condition for resuming.

Split broad features into testable requirements. Preserve the complete scope below, but implement it incrementally. A mock is acceptable at an external provider boundary when explicitly labeled; it is not a replacement for the internal business behavior under test.

Use precise status language:

- **Implemented** means the behavior exists in code.
- **Verified** means the acceptance criteria have been checked in the reported environment.
- **Simulated** means an explicit substitute exercises an external boundary.
- **Blocked** identifies an actual missing prerequisite.

Never mark an item complete because a file, route, type, screenshot, or placeholder exists. Do not use arbitrary completion percentages. The overall program is complete only when the agreed requirements are verified or the user explicitly accepts a revised scope.

## 4. Execution model and persistent context

Work autonomously within the user's authorized scope. Make reversible implementation decisions and record significant assumptions. Ask only when missing information materially changes scope, safety, cost, or an irreversible external action. Continue independent work while a question is pending.

Maintain these durable records:

```text
AGENTS.md
docs/planning/brief-changes.md
docs/planning/requirements.md
docs/planning/roadmap.md
docs/planning/current-milestone.md
docs/planning/progress.md
docs/planning/verification.md
docs/planning/risks-and-assumptions.md
docs/architecture/repository-map.md
docs/adr/
```

Keep `AGENTS.md` concise: commands, boundaries, invariants, code conventions, and links to deeper context. Avoid duplicating the entire brief across documents.

Use this Manager Loop:

1. **Orient:** inspect repository instructions, current state, recent changes, and failing checks.
2. **Decompose:** choose a bounded vertical slice and define acceptance criteria before implementation.
3. **Plan:** identify domain ownership, data changes, contracts, failures, and verification.
4. **Implement:** complete the smallest coherent behavior and its meaningful tests.
5. **Verify:** run relevant checks and inspect the resulting behavior against acceptance criteria.
6. **Review:** look for security gaps, drift, shallow tests, unnecessary complexity, and incomplete failure handling.
7. **Teach:** write or update code-linked lessons, exercises, and debugging records.
8. **Record:** update requirements, evidence, risks, and the next concrete task.
9. **Continue:** advance until the authorized scope is complete or an actual blocker prevents further useful work.

Do not end with a plan when implementation is authorized and feasible. Do not conceal incomplete work when an execution limit is reached. Leave a resumable checkpoint with exact next steps, pending checks, and blockers.

Use parallel agents only for bounded, independent tasks when available and authorized. Define file ownership and integration contracts; prefer separate worktrees for overlapping changes. Keep schema changes, contract changes, and integration ownership coordinated. Teach the costs of parallelism even when execution is sequential. A single agent may perform the manager, implementer, and reviewer roles; do not claim independent review unless it occurred.

## 5. Technology choices and repository architecture

Default to:

- Strict TypeScript. Avoid `any`; validate untrusted data and narrow `unknown`.
- React and Next.js for the web application, using accessible semantic HTML.
- Zod for runtime validation at appropriate trust boundaries.
- TanStack Query when client-side server-state coordination warrants it.
- Zustand only for shared client state that simpler React patterns do not handle well.
- A TypeScript **modular monolith** backend with explicit domain boundaries.
- PostgreSQL as the transactional source of truth.
- A TypeScript data layer selected through a short Prisma/Drizzle/alternative comparison.
- A background worker using durable persisted jobs/events.
- Docker Compose for practical local infrastructure and GitHub Actions for CI.

Choose the backend framework and data layer in ADRs. Compare transaction control, SQL visibility, migrations, constraints, testing, maintainability, and team learning cost. Evaluate whether Next.js server capabilities or a dedicated backend framework best supports the boundaries; avoid duplicate backend business logic.

At implementation time, verify supported stable versions and relevant APIs using official sources. Pin compatible versions, record runtime requirements, and commit the lockfile. Avoid speculative dependencies, obsolete examples, and gratuitous framework churn.

A possible starting layout is:

```text
apps/web/
apps/api/
apps/worker/
packages/contracts/
packages/config/
infra/
scripts/
tests/
docs/
```

Adapt this layout if a simpler structure serves the chosen framework. A separate worker process does not by itself make the application a microservice architecture.

Domain modules own their business rules and persistence. Cross-domain mutations go through explicit application interfaces or events. Do not create a global services folder that erases ownership. Do not import server secrets or persistence code into the browser bundle. Add automated boundary checks where they prevent realistic mistakes.

Use Redis, object storage, a broker, search, or additional services when a milestone demonstrates why they are necessary. Begin with a durable PostgreSQL outbox/job design if it meets the initial requirements. Do not require a large infrastructure stack for a learner's first successful run.

## 6. Business rules and non-negotiable invariants

Write a glossary and invariant catalog before the first transactional slice. At minimum:

### Tenant isolation and authorization

- Every tenant-owned resource has an explicit tenant owner.
- Derive active tenant context from authenticated, authorized membership; never trust a caller-supplied tenant ID alone.
- Enforce authorization in backend/domain entry points, including jobs, exports, webhooks, and agent tools.
- Use database constraints to prevent cross-tenant references; document whether row-level security adds defense in depth.
- Test cross-tenant reads and mutations using at least two tenants, including guessed identifiers.
- Distinguish organization membership, employee records, customer identities, and service principals.

### Money and ledger integrity

- Represent money using integer minor units or a deliberate fixed-precision model, always with currency. Never use binary floating-point arithmetic for financial amounts.
- Define rounding, supported currencies, discount allocation, tax/shipping assumptions, and refund limits.
- Snapshot purchased prices and relevant product details so later catalog edits do not rewrite order history.
- Use an append-only, balanced ledger model with corrections through compensating entries. Define the unit within which entries must balance.
- Reconcile local financial state with provider observations. An HTTP timeout does not prove that a payment failed.

### Inventory and concurrency

- Define on-hand, reserved, available, damaged, and in-transit quantities as needed.
- Do not oversell under concurrent checkout unless an explicit backorder policy allows it.
- Release or expire reservations exactly according to policy, including cancellation and uncertain payments.
- Use transactions, atomic updates, constraints, locking, or optimistic versions deliberately; demonstrate concurrency with competing operations in tests.

### State and delivery

- Define allowed order, payment, refund, fulfillment, workflow, and agent transitions.
- Reject stale updates and invalid transitions explicitly.
- Treat asynchronous delivery as at least once unless stronger guarantees are actually proven.
- Make duplicate handling safe through durable idempotency and transactional effects.
- Do not claim end-to-end exactly-once delivery.
- Persist business writes and their outbox records in the same database transaction.
- Design failure recovery for crashes before and after external side effects.

## 7. Domain requirements

Each domain needs a concise ownership description, schema, application interface, authorization rules, failure semantics, relevant UI, and meaningful verification. Introduce depth through connected flows, then expand coverage.

| Domain | Required capability |
| --- | --- |
| Identity and tenancy | Organizations, users, teams, memberships, authentication, sessions, RBAC, API keys, audit logs, tenant isolation; ABAC only for a concrete policy requirement. |
| Commerce | Products, variants, categories, prices, carts, checkout, orders and lifecycle, discounts, refunds, returns; explicit assumptions about tax and shipping charges. |
| Payments and billing | Provider abstraction, payment intents and state machines, invoices, appropriate subscription use case, refunds, ledger, reconciliation, signed webhooks, idempotency. Distinguish Forge SaaS billing from a tenant's customer payments. |
| Inventory | Warehouses, stock balances, reservations and expiry, adjustments, transfers, immutable stock movement history, low-stock conditions, concurrent allocation. |
| Fulfillment | Fulfillment lifecycle, shipments, tracking, shipping-provider abstraction, returns, exchanges, partial fulfillment and cancellation policy. |
| CRM | Business accounts, contacts, leads, opportunities, activities, customer relationships, links to orders and support. Avoid conflating CRM accounts with tenant organizations. |
| Support | Tickets, comments, queues, priorities, assignment, SLA concepts, escalation, attachment controls, linked customer/order/payment/fulfillment context. |
| Project and engineering management | Projects, issues, tasks, statuses, dependencies, iterations or sprints, comments, incidents and linked remediation work. |
| Workforce and internal operations | Employees, onboarding, teams, internal permissions, tasks and operational workflows; restrict sensitive employee data. |
| Notifications | Email implementation or local adapter, SMS/push abstractions, in-app notifications, preferences, versioned templates, retries, delivery state. |
| Workflow automation | Versioned trigger → conditions → actions definitions, durable execution, bounded retries, histories, failures, replay policy and authorization. |
| Analytics | Versioned event schemas, collection, operational reports and dashboards, useful funnels, metric definitions, freshness and duplicate handling. |
| Observability | Structured logs, metrics, traces, correlation, dashboards, actionable alert concepts, incidents and investigation links. |
| Developer platform | Documented public/internal APIs, scoped API keys, pagination, rate limiting, webhook subscriptions and delivery, signatures, retries, API versioning strategy, a small useful SDK example. |
| AI platform | Provider interfaces, validated structured outputs, tool calling, durable runs, human approval, traces, token/cost accounting, versioned prompts, datasets and regression evaluation; RAG for a justified retrieval need. |

All external adapters need explicit timeouts, error classification, bounded retries where safe, and deterministic test substitutes. Clearly identify which providers are simulated and which integrations require credentials.

## 8. APIs and database engineering

Define resource naming, REST conventions, validation, pagination, filtering, allowlisted sorting, stable error codes, and request IDs. Publish OpenAPI or an equivalent machine-verifiable contract with working examples. Use GraphQL only when a demonstrated requirement justifies another API model.

For operations requiring idempotency, define key scope, request fingerprinting, durable result storage, concurrent request behavior, retention, and conflict behavior when a key is reused with a different payload. Specify how client retries recover an uncertain outcome.

Teach SQL directly. Include real schema constraints, indexes, query plans, transactions, isolation behavior, joins, pagination, N+1 detection, locks, and optimistic concurrency in the code and Academy.

Review every migration for integrity, compatibility, lock duration, and data backfill behavior. Test clean installation and upgrade paths. Document forward recovery when rollback would lose data. Keep seed/demo data separate from schema migrations.

For sensitive administrative changes, record actor, tenant, action, target, outcome, timestamp, and correlation without storing secrets. Distinguish audit records from mutable business timelines and general debug logs.

## 9. Asynchronous processing, workflows, and caching

Define an event envelope containing event ID, type, schema version, tenant ID, aggregate ID/version where useful, occurrence time, correlation ID, causation ID, and validated payload.

Specify event ownership, compatibility, publication, and consumption rules. Document which consumers require ordering and how they detect stale events. Minimize personal information in events.

Implement:

- Durable enqueueing and transactional outbox publication.
- Idempotent consumer effects and durable deduplication where required.
- Worker claims/leases, crash recovery, and bounded concurrency.
- Retry classification, exponential backoff with jitter, attempt limits and deadlines.
- Dead-letter handling with inspectable reasons and controlled replay.
- Backpressure, queue-age visibility, and poison-message handling.
- Clear semantics for provider side effects when completion cannot be confirmed.

Workflow conditions and actions use a validated, bounded format. Do not execute arbitrary user-provided code. Persist definition versions with runs; define cancellation, replay, loop prevention, execution budgets, and permissions evaluated at execution time.

Teach cache-aside, TTL, invalidation, stale data, stampedes, and when not to cache. If adding a cache, document what remains correct when it is absent or stale, and test that fallback. Never make a cached stock count or permission decision the sole authority for a sensitive write.

## 10. AI execution architecture and useful domain agents

Build domain agents, not merely a chat interface. Route mutations through the same domain services and authorization rules used by human-facing APIs.

Provide a deterministic local provider and tool fixtures so the entire learning path and CI work without paid AI credentials. Add real provider adapters behind configuration with documented capabilities and limitations.

Every run records: tenant, actor, goal, agent/prompt/model version, state, steps, tool inputs and outputs subject to redaction, timestamps, duration, token usage when available, estimated cost and pricing basis, retries, failures, approvals, and final outcome. Distinguish unavailable usage from zero usage. Do not store hidden chain-of-thought; store concise decision summaries and observable evidence.

Implement these agents:

1. **Support agent:** retrieve ticket/customer/order/payment/fulfillment context, summarize evidence, propose a permitted action, obtain approval for sensitive effects, execute through domain services, verify final state, and update the ticket.
2. **Incident agent:** inspect bounded telemetry and deployment metadata, link evidence, generate explicitly qualified hypotheses, create/link an incident and engineering issue, and propose remediation requiring approval where appropriate.
3. **Inventory agent:** inspect stock, reservations, sales velocity, incoming supply and supplier data; recommend replenishment and optionally create a draft purchase order. State uncertainty when data is insufficient.
4. **Finance/reconciliation agent:** detect inconsistent order/payment/refund states, open a case, collect evidence and propose correction. Deterministic code validates amounts, state transitions and ledger invariants.

Agent execution needs bounded steps, timeouts, token/cost limits, cancellation, retries, resumability, and protection against repeated side effects. Model output is untrusted input. Validate every structured response and every tool argument.

Human approval must be a persisted authorization decision tied to the tenant, reviewer, exact action and argument digest, relevant resource version, expiry, and execution state. Prevent argument substitution, stale approval, unauthorized approval, and duplicate execution. Revalidate current business rules immediately before acting.

Treat retrieved text, ticket contents, uploaded files, and tool results as data, never as instructions granting privileges. Tools must be allowlisted, tenant-scoped, least-privileged and bounded. Do not give a model arbitrary SQL, shell access, unrestricted network fetching, or implicit administrator privileges.

When RAG is justified, specify ingestion, provenance, access filtering before retrieval, deletion propagation, freshness, citations, evaluation, and defenses against cross-tenant retrieval.

Build an Agent Operations UI for run history, step inspection, evidence, tool activity, latency, usage/cost, failures, retries, approvals, cancellation, and verified outcomes. Redact sensitive fields according to viewer permissions.

## 11. AI evaluation as an engineering discipline

Create versioned datasets and an executable evaluation harness. Include successful, ambiguous, adversarial, stale-data, missing-data, permission-denied, malformed-output, timeout, and tool-failure cases.

Measure:

- Structured-output validity and contract adherence.
- Tool selection and valid arguments.
- Correct final domain state and lack of unauthorized side effects.
- Approval compliance, tenant isolation and evidence grounding.
- Task completion, abstention, and failure rates.
- Latency distributions, token usage, and estimated cost.

Use deterministic checks for business rules, permissions, tool calls, and final state. Use rubric-based or model-based judging only for qualities that cannot be adequately asserted, and document calibration, variability, and evaluator limitations.

Separate repeatable fixture-based CI tests from opt-in live-provider evaluations. Freeze relevant dataset, prompt, model identifier, settings and tool versions in results. Prevent training/example leakage into evaluation cases where relevant.

Establish an initial baseline and explicit regression budgets before using evaluation as a gate. Security and unauthorized-action failures have zero acceptable tolerance. Do not hide failures inside aggregate averages.

Teach why “it looked good when I tried it” is inadequate: one plausible response does not verify permissions, tool correctness, recovery, cost, or consistent task outcomes.

## 12. Frontend and user experience

Build task-oriented interfaces for the connected flows. Give users clear state, permitted actions, pending asynchronous work, failures, and recovery options.

Provide tenant-aware navigation, role-appropriate actions, search/filter/pagination where needed, validated forms, useful empty states, loading states, and actionable errors. Backend authorization remains authoritative even when the UI hides actions.

Use semantic controls, keyboard navigation, visible focus, accessible names and error messages, sufficient contrast, and sensible responsive layouts. Include targeted accessibility checks and manual keyboard verification for critical flows.

Keep server state, URL state, local component state and shared client state distinct. Use optimistic updates only where failures can be reconciled safely; communicate pending financial and inventory operations accurately.

Seed a coherent demo organization with linked records and realistic success/failure journeys. Display simulated integrations clearly. Avoid decorative graphs or status panels that imply telemetry or data the system does not collect.

## 13. Security, privacy, and external effects

Create a threat model covering tenants, sessions, APIs, providers, workers, uploads, webhooks, agents, approvals, and administrative operations. Tie mitigations to tests and implementation.

Use established authentication/session components or a documented standards-based integration. Do not invent cryptography. Address cookie security and CSRF where applicable, XSS, injection, SSRF, credential storage, scoped API keys, rate limiting, upload limits, content-type handling, and dependency security.

Verify payment and developer webhooks using the correct raw payload, signature scheme, timestamp/replay policy, secret rotation strategy, and trusted tenant/provider mapping. Validate outbound webhook destinations and network behavior against SSRF, including redirects and private network access.

Use least-privilege database and service credentials. Keep secrets out of source control, client bundles, logs, traces, fixtures and learning material. Store API keys using a deliberate secure verification scheme and show secret material only when required at creation.

Define retention, deletion and redaction expectations for customer data, attachments, employee data, agent inputs and telemetry. Use synthetic seed data. Never collect or store raw payment card credentials; use simulated or provider-tokenized payment references.

Local execution uses safe adapters by default. Publishing, deploying, contacting real people, incurring material cost, or mutating a live external system requires authorization already present in the session or explicit approval. Prepare the concrete artifact and validation before requesting final approval for an external action.

## 14. Chaos and failure engineering

Build a development-only Chaos / Failure Console with a backend gate, scoped authorization, visible active injections, expiry, reset, and an audit trail. Production startup must reject unsafe chaos configuration. Hiding a UI button is not sufficient isolation.

Track and implement controlled scenarios for:

- Payment provider 500, timeout, duplicate webhook and out-of-order webhook.
- Inventory timeout, concurrent oversell attempts and reservation expiry races.
- Redis unavailability once Redis is introduced.
- Worker crash before/after side effects, message failure, duplicate event and consumer lag.
- Deadlock, stale version update and serialization conflict where applicable.
- Notification outage and external API rate limiting.
- Malformed LLM output, LLM timeout, agent tool failure and approval expiry.

Each scenario needs a reproducible trigger, expected symptoms, protected invariant, recovery behavior, telemetry evidence, executable verification where practical, and a learner lab.

Use virtual clocks, deterministic randomness, controlled fixtures, or process termination as appropriate. Do not substitute arbitrary sleeps for concurrency control. Unsafe or resource-heavy experiments must be isolated, bounded and explicitly invoked.

Demonstrate idempotency, transaction boundaries, retries/backoff/jitter, dead letters, locks, optimistic concurrency, compensation, eventual consistency and reconciliation through these cases. Add circuit breakers only when a concrete dependency failure pattern warrants them.

## 15. Testing and verification

Build a risk-based testing pyramid:

- Unit tests for calculations, policies, validators and state machines.
- PostgreSQL integration tests for constraints, tenant isolation, transactions, idempotency, migrations and concurrency.
- API tests for authentication, authorization, validation, pagination, errors and retry behavior.
- Contract tests for provider adapters, event compatibility and webhooks where they protect real boundaries.
- Worker tests for crashes, duplicates, retries, dead letters and recovery.
- E2E tests for critical user journeys across the real application.
- AI evaluations for tool behavior, approvals, security and outcomes.

Do not use a mocked repository or SQLite as proof of PostgreSQL locking, transaction or constraint behavior. Run concurrency tests with distinct connections and controlled coordination. Use meaningful assertions on persisted state and forbidden effects, not only return values.

Keep tests deterministic, isolated and practical to run. If infrastructure is missing, report the test as unrun or blocked; never silently skip it and claim validation passed. Document fixture ownership and cleanup.

Each meaningful milestone must satisfy its applicable gates:

1. Acceptance criteria demonstrated, including important unhappy paths.
2. Formatting, lint, strict type checking and build pass.
3. Relevant tests and evaluations pass.
4. Clean database setup and applicable migration upgrades verified.
5. Critical UI flow and accessibility checked when UI changes.
6. Tenant isolation, authorization and audit implications reviewed.
7. Telemetry and recovery behavior inspected.
8. Lessons, runbooks, contracts and requirement evidence updated.

Record commands, environment, results and limitations. Avoid meaningless coverage targets and unnecessary reruns after unchanged checks pass. Broaden testing when new evidence or risk warrants it.

## 16. Observability and production operations

Propagate request, correlation, causation and tenant context across HTTP, jobs, provider callbacks, workflows and agent runs while controlling sensitive data and metric cardinality.

Implement structured logs and meaningful metrics; introduce OpenTelemetry tracing across the first asynchronous cross-domain flow. Use logs for detailed events, metrics for aggregate health and trends, and traces for causal execution paths. Teach these distinctions with actual failed Forge operations.

Measure at least critical request errors/latency, payment uncertainty, outbox age, queue age, retries/dead letters, reservation expiry, webhook delivery, workflow failures, and agent execution/approval outcomes as those capabilities arrive.

Define user-centered SLIs and initial SLO targets for critical journeys. Clearly distinguish local targets from measured operational guarantees. Alert on actionable symptoms and include runbook links.

Provide configuration validation, health/readiness checks, graceful shutdown, worker draining, backup and restore procedures, migration procedures, recovery runbooks, and deployment architecture. Verify a local restore rather than only describing backups.

Document an AWS-style deployment model with network boundaries, identity, secrets, PostgreSQL, workers, storage, observability, scaling and cost considerations. Infrastructure planning does not authorize paid provisioning.

## 17. Performance and architectural evolution

Capture baselines before optimizing: workload, hardware/environment, dataset size, concurrency, throughput, p50/p95/p99 latency, error rate, resource use and relevant query plans. Identify the actual bottleneck.

Perform representative API/load tests, query analysis, frontend performance analysis, cache analysis and worker-throughput tests. Avoid extrapolating local synthetic results into production guarantees.

Begin with the modular monolith. Later evaluate extraction candidates such as notifications, workflow execution, analytics ingestion or AI execution. Prefer one carefully chosen extraction over a fleet of services.

Before extraction, document:

- Measured or reproducible problem and simpler alternatives.
- Boundary, data ownership, coupling and contract.
- Communication, delivery semantics and compatibility.
- Failure modes, observability and operational cost.
- Migration/cutover plan, rollback/forward recovery and deployment changes.

Carry out a selected extraction when evidence supports it. If the running system does not justify production extraction, use an isolated comparative learning deployment and label it accordingly; do not manufacture a performance claim.

Afterward, compare what became **better, worse, harder and easier**, including tests, local development, consistency, latency, deployment and incident response. Preserve the working end-to-end journey and measure the result.

## 18. Forge Engineering Academy

Assume the learner knows basic JavaScript, TypeScript, React, Node.js, REST, SQL, Git and CRUD. Build bridges from those skills to stronger mid-level and eventual senior engineering. Explain precisely without oversimplifying.

Create and maintain this structure as relevant content is implemented:

```text
docs/
  planning/
  architecture/
  adr/
  domains/
  api/
  database/
  distributed-systems/
  security/
  testing/
  observability/
  performance/
  ai/
  runbooks/
  upskilling/
    README.md
    curriculum.md
    learning-path.md
    glossary.md
    foundations/
    frontend/
    backend/
    databases/
    testing/
    debugging/
    architecture/
    system-design/
    distributed-systems/
    security/
    observability/
    devops/
    ai-engineering/
    agentic-engineering/
    exercises/
    labs/
    interview-prep/
    code-reading/
    debugging-challenges/
```

The curriculum identifies prerequisites, learning outcomes, linked milestones and assessment tasks. Start with a usable orientation and the first implemented lesson; do not create dozens of empty files and describe the Academy as complete.

Every significant implemented concept should have a lesson covering:

1. What it is and why the engineering problem exists.
2. Forge's concrete use and the invariant it protects.
3. Follow-the-code links to real files and symbols.
4. Request/data flow, with a diagram when useful.
5. Failure scenario and how to reproduce/observe it.
6. Common junior mistake and why it fails.
7. Production considerations and tradeoffs.
8. A meaningful exercise and debugging challenge.
9. Relevant interview questions with reasoning guidance.
10. A concise takeaway.

Prefer runnable commands, real SQL, observed traces and actual domain behavior over generic essays. Keep links valid as code moves. Label hypothetical examples and observed incidents separately.

## 19. Exercises, code reading, and debugging

Provide junior, mid-level and advanced exercises tied to actual Forge code. Each needs prerequisites, setup, goal, constraints, observable acceptance criteria, a verification command or procedure, staged hints and separate solution notes.

Cover practical work such as pagination, missing indexes, N+1 queries, race conditions, idempotency, duplicate delivery, authorization defects, checkout tracing, retry policy, queue backlog, slow endpoints, React state/rendering defects, broken transactions, endpoint design, webhook verification and failed agent tools.

Include code-reading tasks requiring the learner to:

- Trace checkout from HTTP request to database commit and external payment completion.
- Find every authorized inventory mutation path.
- Explain tenant enforcement across API, jobs and agent tools.
- Prove why duplicate event delivery does not duplicate a business effect.
- Trace an agent tool proposal through approval to verified domain mutation.
- Find which data is authoritative when UI, cache and provider observations disagree.

Create intentional debugging defects only in isolated fixtures, opt-in labs, patches or reproducible branches. Keep the default application correct. State the invariant violated, expected evidence, reset procedure and success criteria.

For real agent-generated mistakes encountered during this build, record:

**Problem → original approach → why it failed → diagnosis → fix → verification → general lesson.**

Do not invent incidents and present them as actual development history.

## 20. Agentic engineering curriculum

Make `docs/upskilling/agentic-engineering/` a central part of the Academy. Cover:

- Coding agents versus autocomplete; tools, planning, execution, verification and context limits.
- Repository instructions, investigation before edits, task decomposition and acceptance criteria.
- Context engineering using `AGENTS.md`, repository maps, ADRs, schemas, contracts, examples and tests.
- The actual Manager Loop used in Forge, including checkpoints and feedback.
- Long-horizon risks: context degradation, local optimization, architecture drift, diminishing progress, external state and false completion.
- Parallelism: independence, worktrees, shared-file conflicts, integration, merge conflicts, duplicated effort and coordination overhead.
- Reviewing generated code for hallucinated APIs, dependency growth, dead code, duplicate logic, huge files, unnecessary abstraction, error swallowing, security gaps and shallow tests.
- Debugging agents with concrete build examples, evidence, narrowed tasks and verification.
- Evaluating engineering-agent completion through compiler/lint/static analysis, tests, acceptance criteria, behavioral checks, review and repository invariants.
- Distinguishing coding agents used to build Forge from domain agents operating within Forge.

Provide practical task templates, review checklists and annotated examples of strong and weak agent instructions. Teach that passing tests is necessary evidence for covered behavior, not proof that every requirement was understood or every security issue eliminated.

## 21. Delivery milestones and sequencing

Refine this roadmap after repository inspection. Every milestone includes a usable slice, tests, operational evidence and Academy material. Keep future scope in the register instead of building every module shallowly at once.

| Milestone | Working outcome | Required evidence and learning |
| --- | --- | --- |
| 0. Brief and architecture | Revised brief, scope register, user journeys, domain map, core invariants, stack ADRs, first slice acceptance criteria. | Summary before application code; explicit assumptions and a realistic runnable development plan. |
| 1. Walking skeleton | Reproducible startup, web/API/database wiring, migrations, two demo tenants, authentication/membership and one authorized tenant resource. | CI, API/database tests, cross-tenant rejection, first code-reading lesson. |
| 2. Commerce transaction | Catalog, cart, price snapshot, checkout, order, reservation, simulated payment boundary and transactional outbox. | Concurrent last-item purchase, duplicate checkout, provider uncertainty and compensation/reconciliation tests; transaction lesson. |
| 3. Durable operations | Worker, safe duplicate consumption, fulfillment, customer timeline and notifications connected to checkout. | Crash recovery, retry/dead-letter behavior, event tracing and eventual-consistency lab. |
| 4. Customer and workforce operations | CRM, support, projects/incidents and employee onboarding integrated with shared customers, orders, teams and tasks. | Role-based journeys, sensitive-data checks, failure states and code-reading exercises. |
| 5. Finance and inventory depth | Refunds/returns/exchanges, ledger, invoices, appropriate subscriptions, reconciliation, warehouse transfers and replenishment. | Financial invariants, partial-operation rules, webhook reordering and inventory race tests. |
| 6. Automation and developer platform | Versioned workflow engine, analytics/reporting, API keys, rate limits, signed outbound webhooks and SDK example. | Safe replay, authorization at execution, delivery recovery, useful operational metrics and API lessons. |
| 7. AI platform and support agent | Provider interface, tools, durable runs, approval lifecycle, Agent Operations UI and evaluated support resolution. | Deterministic CI evaluations, denied tools, stale approvals, malformed outputs and outcome verification. |
| 8. Additional agents and resilience | Incident, inventory and finance agents; justified retrieval; full planned chaos coverage as dependencies become available. | Agent-specific golden cases, prompt-injection tests, recovery labs and regression reports. |
| 9. Operational hardening | Complete key dashboards, SLO definitions, security review, restore drill, load baselines and deployment/runbook artifacts. | Reproducible evidence, bottleneck analysis, documented limitations and recovery exercises. |
| 10. Architecture evolution and completion | Selected extraction or labeled comparative experiment, remaining scope verification and Academy integration. | Before/after tradeoffs, contract/recovery tests, requirement audit and learner capstone. |

Security, observability, evaluation and failure handling begin with their first relevant feature. Their later milestones deepen coverage; they are not permission to postpone fundamental correctness.

## 22. Kickoff procedure and reporting

On a build-authorized execution:

1. Inspect repository contents, instructions, existing changes, runtime/tool availability and infrastructure constraints. Preserve unrelated work.
2. Apply Rule 0, save the improved brief/change summary, and report the material changes before application implementation.
3. Create the requirements register, roadmap and initial ADRs; resolve the first vertical slice's key invariants.
4. Establish documented setup, configuration, migrations, deterministic seeds and CI commands appropriate to the chosen stack.
5. Build and verify Milestone 1, including its first Academy lesson and exercise.
6. Continue the Manager Loop through subsequent milestones within the authorized scope.

Share concise progress updates explaining what works, what evidence supports it, what remains uncertain and what the next step will resolve. Do not narrate every command.

At meaningful checkpoints report:

- Working behavior delivered and requirement IDs advanced.
- Verification performed and exact material limitations.
- Architecture or scope decisions and their reasons.
- Academy lessons, exercises and labs added.
- Remaining blockers, risks and the next concrete slice.

The final handoff must include a verified quickstart, demo journeys, architecture map, requirement/evidence index, test/evaluation commands, recovery instructions, learning path and candid outstanding limitations. Do not call the program complete while required work remains.
