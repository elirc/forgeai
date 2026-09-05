# Learning path

Prerequisites: basic TypeScript, React, REST, SQL and Git. You do not need distributed-systems experience.

1. Run the README quickstart and create an order. Explain each visible state without reading the code.
2. Read the repository map and [tenant lesson](security/tenant-isolation.md). Trace where a user identity becomes an authorized tenant context.
3. Read [transactions and concurrency](databases/transactions-and-concurrency.md). Predict what two purchases of the last item will do; then run the named test.
4. Read [durable jobs](distributed-systems/durable-jobs.md). Trigger the payment-timeout lab and join request/job/audit records by correlation.
5. Complete the junior, mid-level and advanced [commerce exercises](exercises/commerce-slice.md).
6. Read [agentic engineering](agentic-engineering/manager-loop.md). Write a bounded task with acceptance criteria for one improvement and verify the result independently from the agent's narrative.
7. Revisit the [curriculum](curriculum.md) as subsequent milestones land.

Assessment: demonstrate one forbidden action, one race that remains correct, one uncertain external outcome that recovers safely, and one test that would fail if the protected invariant were removed. Explain the tradeoff behind each implementation, not just its syntax.
