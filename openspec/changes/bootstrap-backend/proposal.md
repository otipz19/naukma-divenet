# Proposal

## Why

There is no back-end code yet. Every later roadmap item (M0–M6) needs the same
foundation in place first: a building Spring Boot project, a PostGIS database
managed by Flyway, enforced module boundaries, one error format, a committed API
contract, and a back-end step in `pnpm check`. Building these once, before any
feature, stops each feature change from inventing its own version.
This is the first item of M0 in `docs/ROADMAP.md`.

## What Changes

- Add the `backend/` Maven project: Maven Wrapper, Java 25, Spring Boot 4.1, base
  package `ua.ukma.divenet`, and the `shared` module (the first Spring Modulith module).
- Add a PostgreSQL + PostGIS datasource configured from environment variables,
  with Hibernate set to `ddl-auto=validate` and `hibernate-spatial` on the classpath.
- Add the first Flyway migration, which enables the `postgis` and `pg_trgm` extensions.
- Add Testcontainers support (`postgis/postgis`) for integration tests, plus a
  test-classpath launcher that runs the app locally against a throwaway database.
  `compose.yaml` does not exist until `add-local-stack`.
- Add a global error handler that returns RFC 9457 `ProblemDetail` responses for
  404, 400 (validation, with an `errors` list), 405 and unexpected 500 errors. The
  500 response never includes stack traces.
- Add shared pagination settings: the `PagedModel` envelope, a default size of 20
  and a maximum of 100.
- Add Actuator with only `health` exposed, including a database check.
- Add springdoc, plus a test that fails when the generated OpenAPI document
  differs from the committed `api/openapi.json`. A documented flag regenerates the snapshot.
- Add a Spring Modulith `ApplicationModules.verify()` test and a Spotless
  (`palantir-java-format`) check, both run by `mvnw verify`.
- Add a `backend: mvnw verify` step to `scripts/check.mjs`.
- **Roadmap adjustment:** CI installs Java 25 in this change, not in
  `add-local-stack` as the roadmap currently says. Without it the back-end step
  would fail in CI, and `master` only accepts PRs with a green `check` job.
  `docs/ROADMAP.md` is updated to match.
- **Boundary files:** this change edits `scripts/check.mjs` and
  `.github/workflows/check.yml`, which AGENTS.md lists as needing the user's
  approval. Approving this proposal approves those two edits.

Stories covered: none directly. This is infrastructure for every later story.

Out of scope or deferred:
- Spring Security, JWT and user tables: `add-authentication`.
- Domain modules and their tables (`geo`, `site`, …): their own roadmap items.
- `compose.yaml`, Dockerfiles and `.env.example`: `add-local-stack`.
- Front-end and generated TypeScript types: `bootstrap-frontend`.
- The demo seeder: `add-dive-site-catalog` and `complete-demo-seed`.

No departure from `docs/ARCHITECTURE.md` or the ADRs, so no new ADR.

## Capabilities

### New Capabilities

- `shared/api-errors`: the error response format for every API endpoint (RFC 9457 problem details).
- `shared/pagination`: request parameters, limits and the response envelope for paged collections.
- `shared/api-contract`: the committed OpenAPI snapshot, and its guarantee to stay in sync with the running API.
- `shared/database`: the database schema baseline, owned by migrations, with spatial and trigram support.
- `shared/health`: the health endpoint used by operators and, later, container health checks.

### Modified Capabilities

None. `openspec/specs/` is empty.

## Impact

- New: `backend/` (Maven project, wrapper, sources, tests) and `api/openapi.json`.
- Edited: `scripts/check.mjs` (back-end step), `.github/workflows/check.yml`
  (setup-java 25), `docs/ROADMAP.md` (status, CI note), `docs/ARCHITECTURE.md`
  (drop **(planned)** from the parts that now exist), `AGENTS.md` (code map row,
  checks, and boundaries for `db/migration/` and `api/openapi.json`),
  `README.md` (how to run the back-end checks), `docs/HANDOFF.yaml`.
- The gate now needs JDK 25+ and a running Docker daemon locally. CI's
  `ubuntu-latest` runner already has Docker.
- No REST endpoints exist yet other than `/actuator/health`, `/v3/api-docs` and
  the Swagger UI.
