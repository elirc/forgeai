# Debugging lab: paid at the provider, pending in Forge

Difficulty: mid-level. This lab uses an implemented development-only injection. It does not introduce a bug into the default application.

## Setup

Start Forge with `CHAOS_ENABLED=true` in the API and worker. Sign in as the Northstar admin. In Operations choose Timeout after successful charge. Create a small synthetic order.

## Observe

The provider records a successful payment, but the first attempt throws before local confirmation. The job returns to pending with a failure code and retry time. The next attempt reuses provider identity and confirms the order. The transition can be quick; the integration test provides deterministic intermediate assertions.

## Investigation

Find the order, job, payment intent, provider row, audit events and reservation. Explain their states immediately after the first failure. Identify which differences are expected eventual consistency and which would violate an invariant.

## Success criteria

- Exactly one simulator charge exists.
- The order eventually confirms.
- A single notification and shipment record exist.
- Stock remains reserved until shipment.
- The attempt count records the recovery.
- An old lease token cannot finalize after another worker takes ownership.

Run `npm test -- -t "timeout-after-capture"` and `npm test -- -t "expired worker lease"` to verify the deterministic cases.

## Reset

Set the failure console to Normal operation. Injections also expire after five minutes. For provider-unavailable experiments, reset before replaying a dead-letter job. Do not manually delete financial or reservation records to conceal an inconsistent state.
