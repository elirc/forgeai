# Forge Engineering Academy

> **Status note (2026-10-06):** The lessons were re-checked against `main` @ `52f1189`. The one CI run ("Forge checks", 2026-09-05) passed every step, including `npm test` and `npm run test:e2e`. `tests/integration.test.ts` contains 22 tests and `tests/e2e/commerce.spec.ts` contains 3. Every test name the lessons pass to `npm test -- -t` matches an existing test. File:line cites added to the lessons refer to that commit.

Learn production engineering by following and modifying the working system.

Start with the [learning path](learning-path.md), then use the [curriculum](curriculum.md) to see what is implemented and what belongs to later milestones. The [glossary](glossary.md) defines terms using Forge examples.

The first slice has four core lessons: [tenant isolation](security/tenant-isolation.md), [transactions and concurrency](databases/transactions-and-concurrency.md), [durable jobs](distributed-systems/durable-jobs.md), and [the manager loop](agentic-engineering/manager-loop.md). Each points to real code and verification.

Use the [exercises](exercises/commerce-slice.md), [code-reading tour](code-reading/checkout.md), and [debugging lab](debugging-challenges/uncertain-payment.md). Keep defects inside a local lab or patch. Do not weaken default application correctness to make a challenge.
