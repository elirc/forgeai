# From login to tenant isolation

## What it is

Authentication identifies a user. Authorization decides which action that user may take on which tenant's data. A valid session does not mean “may read any product.”

## Why it exists

A CRUD tutorial often assumes one trusted user. A SaaS API receives attacker-controlled URLs, headers and identifiers. Hiding another tenant's links in React does not secure the backend.

## Forge example and follow the code

Read [identity/service.ts](../../../apps/api/src/modules/identity/service.ts) and [app.ts](../../../apps/api/src/app.ts). The identity service hashes a random session token before storage, checks expiry, loads memberships, and derives a principal through `authorize`.

Then read [catalog/service.ts](../../../apps/api/src/modules/catalog/service.ts). The SQL selects by both tenant ID and product ID. Composite foreign keys in [the migration](../../../packages/database/migrations/001_foundation.sql) also prevent cross-tenant child references.

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

## Debugging challenge

Inspect the cross-tenant integration test. Identify the three separate controls protecting reads, writes, and foreign-key integrity. Temporarily remove one predicate in a local patch and confirm the relevant test fails, then restore it.

## Interview questions

Why is an unguessable UUID insufficient authorization? What is the difference between 401 and 403? How would a permission cache change revocation behavior? What would RLS protect that composite foreign keys do not?

## Key takeaway

Derive tenant access from current membership, enforce action policy, and carry ownership through every query and relationship.
