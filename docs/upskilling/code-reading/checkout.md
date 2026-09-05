# Trace a checkout without changing code

Start at [app.ts](../../../apps/api/src/app.ts). Submit one synthetic order and answer:

1. Which schema prevents a caller from supplying an authoritative total or duplicate product IDs?
2. Where is membership checked, and which role cannot mutate?
3. What scopes the idempotency key? What happens if the payload changes?
4. Why are product IDs sorted before locking?
5. Which fields become immutable purchase snapshots?
6. What single database statement prevents overselling?
7. Which writes disappear if the second cart line cannot reserve stock?
8. How can a worker discover the payment command after the API process exits?
9. Which identifier reaches both the provider and the local idempotency store?
10. Which condition prevents an expired worker owner from committing?
11. Where does shipment consume stock? Why is the second identical shipment harmless?
12. Which UI values are current-state counts rather than historical analytics?

Deliver a sequence diagram and exact function/file references. Then run the related integration tests and compare them with your diagram. If your diagram draws a database transaction around the external provider call, revise it.

Assessment: your explanation should distinguish authenticated identity, tenant policy, SQL atomicity, external uncertainty, and eventually visible UI state.
