# Exercise solution guidance

Try the exercises before reading this file. These are design hints, not claims that the extensions already exist.

## Order lines

1. Reuse the authenticated membership and role boundary.
2. Check the order exists within the tenant before reading its lines.
3. Query `order_lines` using both tenant and order IDs and return a validated response.
4. Change the catalog price after purchasing and assert the line price is unchanged.
5. A test that only checks “200” misses the historical-data invariant.

## Audit pagination

Use an ordered pair such as `(created_at, id) < ($cursorTime, $cursorId)` for descending traversal. Bound limit, fetch limit+1, and return the last emitted row as the next cursor. Cursor encoding is not authorization. Include the tenant predicate independently and a matching composite index.

Seed equal timestamps to exercise the tie-breaker. Check page boundaries, empty pages and invalid cursors. Measure with EXPLAIN before claiming the change improves performance.

## Reservation expiry

Start by separating “not yet paid,” “definitively declined/cancelled,” and “provider outcome unknown.” Acquire the same order lock used for payment finalization. Consult a provider status/idempotency contract outside long-held DB locks, then revalidate local state and provider evidence before committing.

A fully general answer requires provider-specific cancellation/capture behavior and cannot be replaced by one age-based SQL statement. Record ambiguous states durably and make recovery inspectable. Tests must target races at the boundary between external observation and local commit.
