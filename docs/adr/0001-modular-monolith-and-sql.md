# ADR 0001: Fastify modular monolith, Next.js, and explicit PostgreSQL

Status: accepted for the first slice.

Use a Next.js App Router web client and a Fastify API with domain modules. A separate process runs durable jobs from the same codebase and database. This keeps deployment and consistency simpler than independent services while allowing worker crash experiments.

Use `pg` with parameterized SQL and small typed domain queries initially. Prisma offers generated models and convenient relationships, but explicit locking and complex constraints would still require SQL. Drizzle offers SQL-like typed queries with less abstraction but adds a second schema representation alongside the educational migrations. Direct `pg` keeps one authoritative SQL schema and visibly demonstrates transactions; the cost is manually maintained query/result contracts. Validate public responses through shared schemas and test database queries against PostgreSQL. Revisit this decision if query maintenance becomes a demonstrated problem.

A transaction uses one checked-out client from BEGIN through COMMIT/ROLLBACK, following the [node-postgres transaction API](https://node-postgres.com/features/transactions). Next.js runs UI concerns; backend policies live in the API modules. [Fastify v5](https://fastify.dev/docs/v5.7.x/Reference/LTS/) and [Next.js App Router](https://nextjs.org/docs/app/getting-started/installation) support the available Node runtime. Exact installed versions are recorded in the lockfile.

Docker is unavailable in the current environment. Provide Compose plus a local development fallback using [embedded-postgres](https://github.com/leinelissen/embedded-postgres), which runs real PostgreSQL binaries, not a database emulator. Keep files in `.local/`, bind loopback, and never use this development configuration for production. No Redis or broker is needed for the first durable queue.

Consequences: explicit SQL review and real database tests are mandatory. Authentication initially supports seeded local credentials through Argon2id and opaque revocable sessions. Account recovery, SSO and provisioning are later identity requirements; do not market this as complete enterprise identity.

## Verified tooling constraints

The installed React ESLint plugin supports ESLint through 9.x, so the workspace retains 9.39.5 despite its deprecation notice. An attempted ESLint 10 upgrade was rejected by dependency resolution; do not use force or legacy peer resolution to hide this incompatibility. Revisit the linter when the React plugin's supported range includes 10. Native tool setup uses explicit pinned allowScripts entries.
