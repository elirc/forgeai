# Forge master prompt — revision summary

This revision turns the original product and curriculum vision into an executable engineering brief. The revised source is [FORGE_MASTER_BUILD_PROMPT.md](../FORGE_MASTER_BUILD_PROMPT.md).

## Most important change

Rule 0 explicitly requires improving the brief and summarizing material changes **before application implementation**. It distinguishes a prompt-editing request from a build-authorized request and prevents repeated prompt rewriting from replacing delivery.

## Material improvements

| Area                         | Improvement                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scope and completion         | A requirement-by-requirement register connects acceptance criteria to code, tests, documentation and evidence. Implemented, verified, simulated, blocked and deferred work are distinguished.                |
| Delivery                     | Eleven dependency-aware milestones start with a working tenant-isolated slice and grow through coherent cross-domain behavior. Security, failure handling and learning accompany each slice.                 |
| Autonomy                     | An explicit Manager Loop governs investigation, decomposition, implementation, verification, review, teaching and continuation. Durable checkpoints support work across sessions.                            |
| Architecture                 | A modular monolith remains the starting point. Framework and data-layer choices require concise ADRs; infrastructure additions and service extraction need a stated problem and evidence.                    |
| Product coherence            | User roles, domain ownership and six connected journeys anchor the domain scope. Ambiguous identities and billing responsibilities are separated explicitly.                                                 |
| Transactions and correctness | Core invariants cover tenant ownership, cross-tenant references, money representation, balanced ledger entries, inventory concurrency, reservations and valid state transitions.                             |
| Payments                     | Provider calls are treated as external effects with uncertain outcomes. Idempotency, reconciliation, refund limits, webhook ordering and compensation require defined behavior.                              |
| Asynchronous systems         | Durable outbox writes, event envelopes, worker leases, crash recovery, retry budgets, dead letters, ordering and replay policies replace vague messaging requirements.                                       |
| AI safety and execution      | Tools share normal domain authorization. Approvals bind to exact actions and relevant versions. Runs have resource budgets, cancellation, redaction, inspectable evidence and explicit outcome verification. |
| AI evaluation                | Deterministic local fixtures and opt-in live-provider evaluations are separated. Versioned datasets, adversarial cases, regression budgets and measurable outcomes define evaluation quality.                |
| Testing                      | Database semantics require real PostgreSQL tests. Concurrency, forbidden side effects, critical UI journeys and failure recovery receive explicit checks. Unrun checks cannot count as passed.               |
| Operations                   | The brief adds reproducible setup, migration upgrade checks, backup restoration, worker draining, actionable telemetry, SLO definitions, measured performance and deployment limitations.                    |
| Chaos engineering            | Failure injection is gated in the backend, scoped, expiring and reproducible. Each scenario identifies its protected invariant, recovery behavior and learner verification.                                  |
| Academy                      | Lessons follow implemented code. Exercises require setup, acceptance criteria, hints and verification. Real development incidents are separated from hypothetical debugging scenarios.                       |
| External actions             | Local substitutes support credential-free learning. Live deployments, paid resources and external communications follow the user's existing authorization boundaries.                                        |

## Preserved scope

All fifteen original product domains remain, along with the four domain agents, Agent Operations UI, AI evaluation harness, workflow engine, development chaos console, architecture evolution, required documentation structure, three exercise difficulty levels, code-reading challenges and agentic-engineering curriculum.

The revision changes sequencing and makes expectations more precise. It does not treat future milestones as completed or remove requirements to simplify delivery.

## Decisions intentionally left to implementation

- Exact framework, data layer, package manager and supported dependency versions after environment inspection and official-source verification.
- Detailed order/payment/reservation transitions, capture policy and compensation rules before the commerce slice.
- Numeric performance targets and regression budgets after a reproducible baseline.
- Real external providers and production deployment targets when their use is authorized.
- The service-extraction candidate after operational evidence or a clearly labeled comparative learning experiment.

## Status of this revision

The prompt revision was delivered before implementation. The user subsequently authorized implementation and requested moving the prompt into `docs/`. Current delivery evidence is tracked in [progress.md](progress.md).
