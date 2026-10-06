# A timeout is not a failed payment

## What it is

A durable job records work that must survive a process crash. At-least-once execution means a job can be retried, so the side effect must have durable idempotency semantics.

## Why it exists

An external provider can capture a payment while the caller loses the response. Retrying with a new identity risks a second charge. Treating the timeout as a decline risks releasing stock already paid for.

## Forge example and follow the code

Read [jobs.ts](../../../apps/api/src/platform/jobs.ts), [provider.ts](../../../apps/api/src/modules/payments/provider.ts), and [payment finalization](../../../apps/api/src/modules/payments/service.ts).

The simulator intentionally stores a charge before throwing `PROVIDER_TIMEOUT_AFTER_CAPTURE`. A retry uses the same order UUID and returns the prior result. This is a simulation of an external boundary, explicitly separate from checkout's transaction.

## Request/data flow

Committed outbox command → worker claim with SKIP LOCKED → lease token → external capture → transaction checks lease token/expiry → order outcome + notification + fulfillment → completed job.

On error, persist a bounded code, incremented attempt count and next eligible time. After five attempts, move the job to dead letter.

Exact places to read (`apps/api/src/platform/jobs.ts` unless noted):

- **Claim** (`claimJob`, `:24-41`). One transaction does two things. It first dead-letters any job that has used its `MAX_ATTEMPTS = 5` budget and is pending or holds an expired lease (`:26-30`). It then claims the oldest eligible job with `FOR UPDATE SKIP LOCKED LIMIT 1`, increments `attempts`, and writes a fresh `lease_token` (a random UUID) with `lease_until = now() + 30 seconds` (`:31-38`). A `running` job whose lease has expired is eligible again. That is how a crashed worker's job is recovered.
- **Contract check** (`:46-52`). The payload must be exactly `{ orderId: uuid }`, `type` must be `payment.requested`, `schema_version` must be 1, and `orderId` must equal `aggregate_id`. Anything else becomes `INVALID_EVENT_CONTRACT`.
- **Provider call** (`payments/provider.ts:22-54`). The simulator first looks up `simulated_provider_payments` by `idempotency_key = orderId` (`:28-36`) and returns any prior result, unless the amount differs (`PROVIDER_IDEMPOTENCY_CONFLICT`). The `payment_timeout` chaos mode inserts the charge and _then_ throws, on attempt 1 only (`:51-52`).
- **Fenced finalization** (`payments/service.ts:18-63`). Inside one transaction, the job row must still match `lease_token = $2 AND state = 'running' AND lease_until > now()` (`:19-23`). The order row is then locked `FOR UPDATE` (`:24-27`), and the outcome is applied only while the order is `awaiting_payment` (`:31`). A stale worker gets zero rows and returns `false` without writing anything.
- **Failure path** (`:78-89`). The job is set back to `pending`, or to `dead` once `attempts >= 5`, again guarded by `lease_token = $2 AND state = 'running'`. Retry delay is `retryDelayMs(attempt) = min(60 s, 1 s × 2^(attempt-1)) × (0.5 … 1.0 jitter)` (`:19-23`).

Replay of a dead job is an admin-only, audited API call that resets `attempts` to 0 (`apps/api/src/app.ts:249-269`).

## Failure scenario

Worker A captures payment, pauses, and loses its lease. Worker B claims the job. If A resumes, a fencing check prevents it from committing as the current owner. B can retrieve the same provider payment and finalize once.

## Common junior mistake

Using an in-memory Set for duplicate events, or calling a system exactly once because its queue usually delivers once. A restart erases that Set. A crash between provider side effect and local commit remains possible.

## Production considerations

Provider-specific idempotency retention, deadlines and lookup APIs matter. Set network timeouts shorter than leases and add heartbeats for longer work. Limit retries to recoverable errors; malformed contracts should ultimately dead-letter with actionable diagnostics. Monitor oldest job age, not just queue length.

## Tradeoffs

PostgreSQL jobs keep the first deployment simple and allow atomic enqueueing. High throughput or many subscribers may justify a broker later. A broker introduces operational cost and does not remove the need for idempotent effects.

## Exercise

Enable the timeout scenario and follow one order's two attempts. Verify one provider row, one notification, and a confirmed order.

**Check:** the test "recovers timeout-after-capture without a second charge" asserts the provider row count, the order status, and `attempts = 2`. It does **not** assert the notification or shipment counts. In a local branch, add `expect((await pool.query('SELECT * FROM notifications')).rowCount).toBe(1)` and the same for `shipments` after the second `processOneJob`. Then run `npm test -- -t "timeout-after-capture"` and confirm it passes. Next, temporarily replace `input.attempt === 1` in `provider.ts:51` with `true`, and predict whether the test still passes. (It does: on attempt 2 the idempotency lookup at `provider.ts:28-36` returns the stored charge before the code reaches the throw.) Run the test to confirm, explain what that says about where the provider's idempotency lives, then restore the line.

## Debugging challenge

Run the lease-fencing test. Explain why checking only `state='running'` is insufficient when the job has already been reclaimed.

## Interview questions

What does at-least-once mean for external effects? Why does an outbox solve one consistency gap but not all of them? How do lease expiry and fencing differ? Why must dead-letter replay be audited?

## Key takeaway

Persist intent before execution, reuse effect identity on retry, and fence stale owners before finalization.
