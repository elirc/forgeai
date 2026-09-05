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

## Debugging challenge

Run the lease-fencing test. Explain why checking only `state='running'` is insufficient when the job has already been reclaimed.

## Interview questions

What does at-least-once mean for external effects? Why does an outbox solve one consistency gap but not all of them? How do lease expiry and fencing differ? Why must dead-letter replay be audited?

## Key takeaway

Persist intent before execution, reuse effect identity on retry, and fence stale owners before finalization.
