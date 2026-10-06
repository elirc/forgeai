# From login to tenant isolation

## What it is

Authentication identifies a user. Authorization decides which action that user may take on which tenant's data. A valid session does not mean “may read any product.”

## Why it exists

A CRUD tutorial often assumes one trusted user. A SaaS API receives attacker-controlled URLs, headers and identifiers. Hiding another tenant's links in React does not secure the backend.

## Forge example and follow the code

Read [identity/service.ts](../../../apps/api/src/modules/identity/service.ts) and [app.ts](../../../apps/api/src/app.ts). The identity service hashes a random session token before storage, checks expiry, loads memberships, and derives a principal through `authorize`.

Then read [catalog/service.ts](../../../apps/api/src/modules/catalog/service.ts). The SQL selects by both tenant ID and product ID. Composite foreign keys in [the migration](../../../packages/database/migrations/001_foundation.sql) also prevent cross-tenant child references.

Exact places to read:

- `login` (`identity/service.ts:18-33`) always runs an Argon2id `verify`, against a dummy hash when the email is unknown (`:16`, `:24`). The response time therefore does not reveal which emails exist. Only `sha256(token)` is stored (`:15`, `:28-31`).
- `getSession` (`identity/service.ts:34-53`) rejects missing or oversized tokens, joins on an unexpired session, then loads **current** memberships.
- `authorize` (`identity/service.ts:54-66`) returns **404 `NOT_FOUND`** when the user has no membership in the requested tenant (`:62`). It does not return 403, because a 403 would confirm that the tenant exists. `requireWrite` (`:67-70`) is the 403 for viewers.
- `app.ts:53-65` adds a second gate for every non-GET request: `Origin` must equal `WEB_ORIGIN` and `x-forge-request: 1` must be present. Otherwise the response is **403 `INVALID_ORIGIN`**, before any session is read. This is the CSRF defence for the `sameSite: 'lax'` cookie (`app.ts:128-134`).
- On `POST /checkout`, authorization runs before the idempotency key is parsed (`app.ts:189-190`). `checkout` repeats `requireWrite` at the domain entry (`commerce/service.ts:39`), so a future caller that skips the HTTP layer is still blocked.

## Request/data flow

Login credentials → Argon2id verification → random opaque session cookie → stored token hash → session lookup → current membership → role policy → tenant-scoped query → validated response.

Membership is checked on each request. Deleting a membership removes access without waiting for the session to expire.

## Failure scenario

A developer changes `WHERE tenant_id=$1 AND id=$2` to `WHERE id=$1`. An attacker can supply a known product UUID from another tenant. UUIDs are identifiers, not permissions.

## Common junior mistake

Trusting a tenant header or React route because the user signed in. The server must prove membership independently.

## Production considerations and tradeoffs

A database-backed session permits immediate revocation but adds a lookup. Caching membership introduces revocation delay. Row-level security can add defense in depth, but requires correct transaction-local context and policies. It is not enabled here; do not assume it protects a missing predicate.

## Exercise

Sign in as the viewer and attempt checkout using an HTTP client. Explain why the API returns 403 even when a browser button is absent.

With `npm run dev` running (API on `127.0.0.1:4000`), run these commands:

```sh
H='-H origin:http://localhost:3000 -H x-forge-request:1 -H content-type:application/json'
curl -s -c jar $H -d '{"email":"viewer@northstar.example","password":"Forge-demo-2026!"}' \
  http://127.0.0.1:4000/api/auth/login          # note memberships[0].tenantId
curl -s -b jar $H -H 'idempotency-key: viewer-try-1' \
  -d '{"customerName":"Test","customerEmail":"t@example.com","lines":[]}' \
  http://127.0.0.1:4000/api/tenants/<tenantId>/checkout
```

**Check:** the second response has `"code":"FORBIDDEN"` (from `requireWrite`), not `VALIDATION_FAILED`. Authorization runs before the body is validated. Now drop the `origin` header and repeat. The code becomes `INVALID_ORIGIN`. Finally, sign in as `owner@harbor.example`, call `GET /api/tenants/<Northstar tenantId>/products`, and get a 404. The deterministic versions of these checks are the tests "blocks viewer mutations and operator admin controls" and "rejects anonymous, cross-tenant list, guessed resource and write requests".

## Debugging challenge

Inspect the cross-tenant integration test. Identify the three separate controls protecting reads, writes, and foreign-key integrity. Temporarily remove one predicate in a local patch and confirm the relevant test fails, then restore it.

## Interview questions

Why is an unguessable UUID insufficient authorization? What is the difference between 401 and 403? How would a permission cache change revocation behavior? What would RLS protect that composite foreign keys do not?

## Key takeaway

Derive tenant access from current membership, enforce action policy, and carry ownership through every query and relationship.
