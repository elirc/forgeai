# Observability in the first slice

Fastify emits structured request/error logs. Every response carries a server-generated `x-request-id`; API clients cannot inject the server request identifier. Checkout stores that ID in its audit and job rows. Payment completion reuses it so Activity and Operations can join the two phases.

The Overview page derives operational counts directly from tenant-scoped SQL: confirmed revenue, order count, pending payments, ready shipments, low-stock inventory and queue/dead-letter counts. These are current-state queries, not a historical metrics system or production SLO evidence.

The worker emits structured startup/poll-failure logs. Per-job failures are durably recorded with bounded failure codes. The admin Operations view exposes job attempts, state and correlation.

OpenTelemetry spans, histogram metrics, a collector/dashboard stack, error reporting and alerts remain planned. Do not interpret a correlation ID as a distributed trace. The next observability slice should propagate trace context across the durable command boundary and verify telemetry export without including customer emails or cookie secrets.
