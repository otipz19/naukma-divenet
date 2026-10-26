# Proposal

## Why

Today the app runs only as two development processes: `mvnw spring-boot:test-run`
on a throwaway database, and the Vite dev server. There is no way to run the
product as it will be demonstrated: the production front-end build behind nginx,
the back-end jar, and a PostGIS database whose data survives a restart. The
architecture already describes that stack (`compose.yaml`, nginx proxying `/api`),
and the M6 E2E suite will run against it, so it should exist before features
pile up on top of untested container wiring.

Roadmap item: `add-local-stack` (M0). It covers no user story; it is the runtime
for all of them.

## What Changes

- **`compose.yaml`** at the repository root with three services:
  - `db`: PostgreSQL 17 + PostGIS 3 (`postgis/postgis`, pinned tag), data in a
    named volume, health checked with `pg_isready`.
  - `backend`: built from `backend/Dockerfile` (multi-stage: the Maven wrapper
    builds the jar on a JDK 25 image, a JRE 25 image runs it). Connection
    settings come from the environment (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`,
    already read by `application.yaml`). Health checked through
    `/actuator/health`; starts only after `db` is healthy.
  - `web`: built from `frontend/Dockerfile` (multi-stage: pnpm builds the SPA,
    nginx serves `dist/`). nginx serves the SPA with a fallback to `index.html`
    for client-side routes and proxies `/api/` (and `/media/`, for
    `add-media-uploads`) to `backend`. Starts only after `backend` is healthy.
  - Only `web` publishes a port to the host (`WEB_PORT`, default 8080). The
    database and the back-end are reachable only inside the compose network.
- **`.env.example`**, the only committed env file: database name, user and
  password, and `WEB_PORT`. `compose.yaml` refuses to start when a required
  variable is missing instead of falling back to a built-in password.
- **`.dockerignore`** files so builds do not send `node_modules`, `target/` or
  `dist/` to the daemon.
- **Checks:**
  - A new gate step, `node scripts/check-compose.mjs`: renders the compose file
    with `.env.example` (`docker compose config`) and fails unless it has the
    three services, a health check on each, pinned image tags, a named volume for
    the database, and a published port on `web` only. Fast; builds nothing.
  - A smoke test, `scripts/smoke-stack.mjs` (root script `pnpm smoke:stack`):
    builds and starts the stack with `.env.example` on a separate compose
    project, waits until every service is healthy, then checks the SPA, the SPA
    fallback, the `/api` proxy and that the database keeps its migration history
    across a restart. It always tears the stack down, volume included.
  - A second CI job, `stack`, next to `check` in `.github/workflows/check.yml`,
    runs the smoke test on every PR and push to `master`. It is not part of
    `pnpm check`, which stays fast enough to run before every commit.
- **Docs:** README "Running the app" gets the compose instructions;
  `docs/ARCHITECTURE.md` drops the **(planned)** marks on `compose.yaml`;
  AGENTS.md lists the new checks and adds `.env` handling to its boundaries, as
  it already promises.

Deferred:

- **Media volume:** mounted by `add-media-uploads`, which creates `MediaStorage`.
  nginx already proxies `/media/` so that change touches only the back-end.
- **Admin bootstrap and JWT key variables:** added to `.env.example` by
  `add-authentication`.
- **The `demo` profile and seed data:** `add-dive-site-catalog` and
  `complete-demo-seed`. The stack starts with an empty, migrated database.
- **HTTPS, a production deployment and image publishing:** out of scope; the
  stack is for local runs and the demo.
- **Making `stack` a required status check** on `master`: a GitHub setting the
  user changes once the job is green (see the workflow follow-up in tasks.md).

## Capabilities

### New Capabilities

- `shared/local-stack`: the containerised runtime: one command starts the
  database, back-end and web server; nginx serves the SPA and proxies the API;
  configuration comes from an env file; database data persists; only the web
  port is exposed; and the gate and CI verify all of it.

### Modified Capabilities

None. `shared/database` already requires connection settings from the
environment, and `shared/health` already defines the endpoint the container
health check calls; neither requirement changes.

## Impact

- **New files:** `compose.yaml`, `.env.example`, `.dockerignore`,
  `backend/Dockerfile`, `backend/.dockerignore`, `frontend/Dockerfile`,
  `frontend/nginx.conf`, `scripts/check-compose.mjs`, `scripts/smoke-stack.mjs`
  and their tests.
- **Gate and CI:** one new step in `scripts/check.mjs`; a `smoke:stack` script in
  the root `package.json`; a `stack` job in `.github/workflows/check.yml`. All
  three files are boundaries in AGENTS.md: the user chose this test approach
  ("CI job + smoke script") while the proposal was written, and approving this
  proposal is asked to cover exactly these three edits.
- **Back-end and front-end source:** unchanged. No API, migration, OpenAPI or
  locale change. `application.yaml` already reads its datasource from the
  environment.
- **Prerequisites:** Docker with Compose v2 (`docker compose`), which the gate
  already needs for Testcontainers.
- **No departure from `docs/ARCHITECTURE.md`**, so no new ADR.
