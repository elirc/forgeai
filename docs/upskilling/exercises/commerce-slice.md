# Commerce-slice exercises

All exercises use a local branch or patch, synthetic data, and the README setup. Keep the default application correct.

## Junior: inspect an order's purchased lines

Prerequisites: REST handlers, SQL SELECT and Zod. Follow the order GET handler and immutable `order_lines` table.

Goal: add a tenant-scoped endpoint that returns product name, SKU, purchased quantity and unit price. Do not read current catalog prices to reconstruct history.

Acceptance: anonymous requests return 401, another tenant cannot read the order, invalid UUIDs return 400, and a catalog price change does not change the response. Add a PostgreSQL API test.

Verify with `npm run typecheck` and `npm test`. Hint: authorize before lookup, and join on tenant ID plus order ID. Further hints and solution approach: [solution notes](commerce-slice-solutions.md).

## Mid-level: keyset pagination for audit history

Prerequisites: composite indexes, stable sort order and API errors.

Goal: replace the latest-30 audit response with bounded cursor pagination. Encode created time and ID; validate cursor data. Preserve tenant filtering. Do not use an ever-growing offset.

Acceptance: no duplicates across pages with equal timestamps; malformed cursors return 400; a cursor from another tenant grants no access; new events do not reorder already traversed history unexpectedly. Add tests with equal timestamps and concurrent inserts.

Verify API tests and inspect the SQL query plan on seeded larger data. Explain why both sort keys are in the cursor.

## Advanced: safe reservation expiry proposal and implementation

Prerequisites: checkout, provider uncertainty, leases and compensation.

Goal: define and implement expiry without releasing stock for an already captured payment. Start with an ADR specifying provider status lookup, race handling, deadlines and order transitions. A blanket UPDATE of old reservations is unacceptable.

Acceptance: timeout-after-capture cannot cause a confirmed payment with released stock; expiry racing with payment finalization remains consistent; duplicate expiry runs have no extra effect; uncertain provider state opens an inspectable recovery path.

Verification requires controlled concurrent SQL connections, a durable provider fixture and failure tests. Explain any states that deliberately remain unresolved for human review. This is a feature expansion: update the requirements register and Academy lesson.
