# Forge repository instructions

Read `docs/planning/current-milestone.md`, `docs/planning/progress.md`, and `docs/architecture/repository-map.md` before changing behavior. Product scope lives in `docs/FORGE_MASTER_BUILD_PROMPT.md`.

- Node 24, npm; run commands from the repository root. Cache and local databases stay inside the workspace.
- Keep strict TypeScript. Validate HTTP and provider inputs with Zod; parameterize SQL.
- Domain modules own mutations. Identity establishes tenant context from membership, never a raw header alone.
- Money is integer USD cents in the initial slice. Inventory changes and order/outbox writes share a transaction.
- Run `npm run typecheck`, `npm run lint`, and relevant `npm test` suites. Database tests use actual PostgreSQL.
- Run `npm run build` and `npm run test:e2e` for integrated UI changes.
- Add code-linked Academy material with significant behaviors. Record actual evidence and outstanding work honestly.
- Keep external providers simulated until an authorized integration is implemented. Do not commit secrets or generated local data.
