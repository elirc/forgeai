# Glossary

- **Tenant:** the organization that owns a resource. A user may have memberships in tenants; identity alone does not grant access.
- **Principal:** the authenticated actor plus authorized tenant and role passed into a domain operation.
- **Invariant:** a condition that must remain true, including during failure. Forge's reserved stock cannot exceed on-hand stock.
- **Transaction:** a group of database writes that commits or rolls back together on one SQL connection.
- **Snapshot:** purchased data preserved at the time of checkout, independent of later catalog edits.
- **Idempotency:** repeated execution produces the intended effect once. Keys require durable scope and payload semantics, not only a cache.
- **Outbox:** a durable event/command written with business state in the same transaction.
- **Lease:** temporary worker ownership that can expire after a crash.
- **Fencing token:** an ownership value checked before committing, so a superseded worker cannot finalize.
- **At-least-once delivery:** processing may occur more than once; consumers must make repeated effects safe.
- **Compensation:** a new action that corrects an earlier effect. It is not a time machine that rolls back an external provider.
- **Reconciliation:** comparing independently observed states and investigating differences.
- **Dead letter:** persisted failed work requiring investigation after the retry budget is exhausted.
- **Optimistic concurrency:** reject a write whose expected version is no longer current.
- **Correlation ID:** a shared identifier connecting records. It is not itself a trace.
- **Evaluation:** repeatable measurement of AI behavior against datasets, checks and outcome criteria.
