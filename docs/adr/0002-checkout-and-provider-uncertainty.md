# ADR 0002: Reserve before asynchronous simulated capture

Status: accepted for the first commerce slice.

Create the pending order, reservation, payment intent and outbox command atomically. Capture payment asynchronously through a provider abstraction. A confirmed payment creates fulfillment work; shipping consumes the reservation. A decline releases it.

Scope idempotency to tenant + actor + key. Compare a fingerprint of the validated, product-sorted request. Concurrent identical keys serialize through a transaction advisory lock and then reuse the committed order. Reusing a key with another request returns 409. Keys remain attached to orders for their lifetime in this slice.

Provider idempotency uses the globally unique order UUID. A response lost after capture is recovered by the same key. Worker finalization checks a lease token and its expiration; an old worker cannot overwrite the state owned by a new claimant.

Tradeoff: customers may see pending payment while the worker runs. Uncertain dead-letter payments retain stock. We have not yet implemented expiry, cancellation of pending payments or refunds; allowing them without reconciliation would introduce unsafe compensation. Those capabilities must extend this state machine with tests before exposing UI actions.

This is a one-warehouse, one-payment-intent initial policy. Partial fulfillment, multiple captures, exchanges, multi-currency and tax calculations require additional domain rules rather than scattered flags.
