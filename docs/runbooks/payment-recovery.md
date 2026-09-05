# Recover an uncertain or dead-letter payment

## Symptoms

An order remains payment pending. Operations shows a pending/running/dead payment job, its attempt count and a failure code. Stock remains reserved deliberately.

## Inspect

1. Find the order and its correlation ID in Activity.
2. Inspect the job. `PROVIDER_TIMEOUT_AFTER_CAPTURE` means the simulator stored a charge before losing the response.
3. For a development lab, inspect the simulator table through a local SQL client. It represents provider state, not an application ledger.
4. Check whether failure injection is active and whether the worker is running.

```sql
SELECT o.id, o.status, p.state, j.state AS job_state, j.attempts, j.last_error
FROM orders o
JOIN payment_intents p ON p.tenant_id=o.tenant_id AND p.order_id=o.id
JOIN jobs j ON j.tenant_id=o.tenant_id AND j.aggregate_id=o.id
WHERE o.tenant_id = $1 AND o.id = $2;
```

## Recover

For pending jobs, the worker retries automatically with bounded exponential backoff. If the worker crashed, another worker claims the expired lease after 30 seconds.

For a dead-letter job, resolve the cause first. Reset the failure console to Normal operation (or wait for its five-minute expiry), then replay as an admin. Replay is audited. The provider key remains the order ID, so an already captured payment is reused.

Verify one provider payment, one order outcome, one notification, and correct reservations. Ship only after confirmation. Refresh the UI or wait for its poll.

Do not manually mark the order declined or release stock based only on a timeout. No automatic expiry/refund/reconciliation worker exists yet. Real provider uncertainty requires provider-specific reconciliation before corrective actions; this runbook currently applies to the simulator.

## Lab

Enable `CHAOS_ENABLED=true` in the API and worker, restart, select Timeout after successful charge, and create a synthetic order. Observe a pending first attempt and a confirmed retry. The deterministic equivalent is the `recovers timeout-after-capture` integration test.
