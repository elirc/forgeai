# Evidence before completion

## What it is

The manager loop separates defining work, implementing it, checking it, and recording what happened. One coding agent can perform those roles sequentially; that does not make its review independent.

## Why it exists

Long tasks exceed the useful context of a single conversation. Agents may optimize the current file, forget earlier constraints, or mistake plausible code for completed behavior. Persistent repository context makes requirements inspectable after the chat has moved on.

## Forge example and follow the code

Start with [AGENTS.md](../../../AGENTS.md), the [current milestone](../../planning/current-milestone.md), the [invariant catalog](../../database/invariants.md), and [integration tests](../../../tests/integration.test.ts).

The build first moved and refined the brief, selected boundaries, defined checkout invariants, implemented a connected slice and wrote tests. Verification results belong in the repository, including failures and unrun checks.

## Task flow

Manager → bounded requirement → implementer → compiler/tests/behavior → review → feedback → lesson → next slice.

A useful task: “Add an endpoint to inspect one tenant-owned order's lines. Acceptance: unauthenticated 401, foreign tenant/resource 404, valid response includes immutable purchased prices, runtime schema and PostgreSQL API test.” A weak task: “Make orders production ready.”

## Failure scenario

An agent adds a stock check in React and claims overselling is fixed. The UI looks right, but concurrent HTTP requests bypass that check. Behavioral verification must target the actual trust and concurrency boundaries.

## Common junior mistake

Accepting the agent's test summary without reading the command, exit code, test assertions or environment. Mock-based tests cannot demonstrate PostgreSQL locks.

## Production considerations

Use small diffs and clear file ownership. Independent verification is valuable for sensitive changes. Parallel agents help with independent tasks but can duplicate abstractions or conflict over shared schemas. Separate worktrees help integration; they do not solve incompatible designs.

## Tradeoffs

More planning is not always better. Record decisions that prevent mistakes, keep the active slice small, and update documents from evidence. Rewriting the same plan repeatedly is not delivery.

## Exercise

Write an agent task for keyset pagination with prerequisites, acceptance criteria, forbidden shortcuts and a verification command. Ask for investigation before code changes.

## Debugging challenge

Review the worker finalization code without relying on its comments. Find the check that would reject a stale claimant. Design a test that proves that specific behavior.

## Review checklist

- Does the implementation match the actual acceptance criteria?
- Do tests assert forbidden effects as well as successful results?
- Are SQL values parameterized and tenant predicates present?
- Did the change add a dependency or abstraction with a demonstrated purpose?
- Are failures surfaced and recoverable?
- Are docs linked to real files? Are simulated and unverified claims labeled?
- Are there source changes without any relevant verification?

## Interview questions

What context should be stored outside a chat? When does parallelism hurt? How do you detect shallow tests? What evidence would justify declaring an agent task complete?

## Key takeaway

An agent's narrative is a hypothesis. Source, invariants, executable checks and observed behavior are the evidence.
