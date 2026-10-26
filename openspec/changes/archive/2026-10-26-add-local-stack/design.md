# Design

## Context

- `backend/src/main/resources/application.yaml` already reads `DB_URL`,
  `DB_USERNAME` and `DB_PASSWORD`, with local defaults. Actuator exposes only
  `health`, without details (`shared/health`). The back-end has no `/api/v1`
  endpoint yet, so the only API response the stack can show is the problem-detail
  404 (`shared/api-errors`).
- The front-end calls the API at `new URL("/api/v1", window.location.origin)`
  (`src/api/client.ts`), so the same build works behind nginx with no build-time
  variable. `src/main.tsx` imports `../../design/system/tokens.css` from outside
  `frontend/`, and the workspace lockfile is at the repository root, so the
  front-end image must be built from the repository root.
- `scripts/check.mjs` runs each step through a shell and stops at the first
  failure. The repository root has no test runner: front-end script tests run
  under the front-end's Vitest (`frontend/scripts/**/*.test.mjs`).
- Local tools: Docker 29 with Compose v2 (v5.5) on Windows; `ubuntu-latest` in CI
  has Docker and Compose v2 preinstalled.
- See proposal.md for scope and `specs/shared/local-stack/spec.md` for the
  requirements.

## Goals / Non-Goals

**Goals:**
- `cp .env.example .env && docker compose up --build` is the whole runbook.
- Config mistakes (missing health check, unpinned image, an exposed database)
  fail `pnpm check` in seconds; runtime wiring is proven by the CI smoke test.

**Non-Goals:**
- Hot reload inside containers. Development keeps using `mvnw` and the Vite dev
  server; the stack is for running the product as built.
- Image size or build-time tuning beyond multi-stage builds and a Maven cache mount.
- Publishing images or deploying anywhere.

## Decisions

### D1. Services, names and wiring

`db`, `backend`, `web` in one default network. `backend` gets
`DB_URL=jdbc:postgresql://db:5432/${POSTGRES_DB}` plus `DB_USERNAME` and
`DB_PASSWORD` mapped from the `POSTGRES_*` variables, so one set of variables
configures both sides. `depends_on` with `condition: service_healthy` orders the
start-up (`db` → `backend` → `web`), so `up --wait` returns only when the API can
answer. All three have `restart: unless-stopped`.

Alternative: `web` depending only on `service_started`. Rejected: nginx would
start returning 502 for `/api` while the back-end is still migrating, which is
what a demo shows first.

### D2. Variables and `.env.example`

`.env.example` holds `POSTGRES_DB=divenet`, `POSTGRES_USER=divenet`,
`POSTGRES_PASSWORD=divenet-local` and `WEB_PORT=8080`, each with a comment.
`compose.yaml` uses `${POSTGRES_PASSWORD:?…}` (and the same for the DB name and
user), so a missing value stops Compose with a message naming the variable.
`WEB_PORT` has a default (`${WEB_PORT:-8080}`), because a port is not a secret.
The `.gitignore` rules for `.env`/`.env.*` with `!.env.example` already exist.

Alternative: defaults for everything, so `docker compose up` works with no env
file. Rejected: ARCHITECTURE.md says secrets come from the environment, and a
silent built-in password is how demo databases end up with one.

### D3. Back-end image

`backend/Dockerfile`, build context `backend/`:
1. `eclipse-temurin:25-jdk` stage: copy the wrapper and `pom.xml` first, run
   `./mvnw -B -ntp dependency:go-offline` (a cached layer), then copy `src/` and
   run `./mvnw -B -ntp package -DskipTests` with a BuildKit cache mount on
   `/root/.m2`.
2. `eclipse-temurin:25-jre` stage: install `curl` for the health check, copy the
   jar, run as a non-root user, `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75`.

Health check: `curl -fsS http://localhost:8080/actuator/health`, interval 10 s,
`start_period` 60 s (Flyway and Hibernate start-up).

`-DskipTests` is not a weakened check: the image build is packaging, and
`pnpm check` still runs every test in `mvnw verify`. Running Testcontainers
inside a Docker build would need the Docker socket in the build.

Alternative: Spring Boot buildpacks (`spring-boot:build-image`). Rejected: it
downloads a builder image of over 1 GB, is slow on first run, and hides the base
image tag that the pinning rule checks.

### D4. Web image and nginx

`frontend/Dockerfile`, build context the repository root (see Context):
1. `node:24-alpine` stage: `npm i -g pnpm@12.15.0` (the version in
   `packageManager`), copy the workspace manifests and lockfile, `pnpm install
   --frozen-lockfile --filter @divenet/frontend`, copy `frontend/` and
   `design/system/`, run `pnpm --filter @divenet/frontend build`.
2. `nginx:1.29-alpine` stage: copy `dist/` to `/usr/share/nginx/html` and
   `frontend/nginx.conf` to `/etc/nginx/conf.d/default.conf`.

`nginx.conf`:
- `location /api/` and `location /media/` → `proxy_pass http://backend:8080;`
  (no URI part, so the path is passed unchanged), with `Host`, `X-Forwarded-For`
  and `X-Forwarded-Proto` set and `client_max_body_size 10m` (ADR-0006 upload limit).
- `location /assets/` → long-lived `Cache-Control: public, max-age=31536000, immutable`
  (Vite hashes these names).
- `location /` → `try_files $uri /index.html;` with `Cache-Control: no-cache`, so
  a new build is picked up on reload.
- `gzip` on for text types.

Health check: `wget -q -O /dev/null http://127.0.0.1/` (BusyBox `wget` ships in
the Alpine image).

The root `.dockerignore` keeps the context small: `**/node_modules`, `.git`,
`backend/`, `frontend/dist`, `openspec/`, `docs/` and the agent folders.
`backend/.dockerignore` excludes `target/`.

### D5. Database

`postgis/postgis:17-3.5` (PostgreSQL 17 + PostGIS 3.5, as in ARCHITECTURE.md),
data in the named volume `db-data` at `/var/lib/postgresql/data`. Health check:
`pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}`. The back-end's Flyway
migration `V1` already creates the `postgis` and `pg_trgm` extensions, so no init
script is needed. Not published to the host (spec: only the web port is exposed);
to inspect it, use `docker compose exec db psql`.

### D6. Image pinning

Every `image:` and every Dockerfile `FROM` names a version tag (`17-3.5`, `25-jdk`,
`24-alpine`, `1.29-alpine`), never `latest` or no tag. Tags, not digests: digests
would need a bot to stay current, and a minor-version tag is enough for a
reproducible demo.

### D7. Gate step: `scripts/check-compose.mjs`

Split into a pure module and a runner, like the front-end gate scripts:
- `scripts/compose-rules.mjs` exports `findComposeProblems(config, dockerfiles)`.
  It takes the JSON from `docker compose config --format json` and the text of
  each referenced Dockerfile, and returns `<service or file>: <message>` strings:
  missing service, missing or disabled health check, `depends_on` not
  `service_healthy` (D1), a published port on any service other than `web`, `db`
  data not on a named volume, an image or `FROM` without a pinned tag.
- `scripts/check-compose.mjs` renders the configuration three times, with a
  scrubbed environment so the caller's own `POSTGRES_*` variables cannot hide a
  problem:
  1. with `.env.example`: no problems from `findComposeProblems`;
  2. with a temporary env file that omits `POSTGRES_PASSWORD`: `docker compose
     config` must exit non-zero and name `POSTGRES_PASSWORD`;
  3. with `.env.example` and `WEB_PORT=9090`: `web` publishes host port 9090.
  It builds nothing and starts nothing, so it runs in about a second.

Tests: `scripts/compose-rules.test.mjs` with `node:test` (the root has no Vitest;
adding one for a few scripts is not worth a root dependency). The gate gets two
steps after the design-tokens step: `node --test "scripts/**/*.test.mjs"`, then
`node scripts/check-compose.mjs`.

### D8. Smoke test: `scripts/smoke-stack.mjs`

- Uses the compose project name `divenet-smoke` and `WEB_PORT=18080`, so it never
  touches a developer's own `divenet` stack or its volume.
- `up --build --wait --wait-timeout 300`, then checks (Node `fetch`):
  `GET /` (200, HTML, `<div id="root">`), `GET /no-such-page` (same body), the
  first `/assets/*.js` named in `index.html` (200, JavaScript),
  `GET /api/v1/does-not-exist` (404, `application/problem+json`, `instance`).
- Restart check: read `installed_rank, installed_on` from
  `flyway_schema_history` with `docker compose exec -T db psql`, run `down`
  (keeping volumes) and `up --wait`, read again, compare.
- Health check: after `up --wait`, `docker compose ps --format json` must show
  all three services `healthy`.
- `finally`: `down -v --remove-orphans`, and print `docker compose logs` when a
  check failed, so the CI log shows why.
- The check list and the tear-down are in an exported `runSmoke(run, http)`
  function with injected command and HTTP runners, so
  `scripts/smoke-stack.test.mjs` can prove that tear-down runs and the exit code
  is non-zero when a check throws, without Docker.

Root `package.json` gets `"smoke:stack": "node scripts/smoke-stack.mjs"`.

### D9. CI job `stack`

A second job in `.github/workflows/check.yml`, parallel to `check`: checkout,
`actions/setup-node@v5` with Node 24, `node scripts/smoke-stack.mjs`,
`timeout-minutes: 30`. It needs neither pnpm nor Java on the runner: both builds
happen inside Docker. Same triggers as `check`.

Alternative: run the smoke test inside `pnpm check`. Rejected by the user while
proposing: it would add minutes to every local gate run.

## Risks / Trade-offs

- [The `stack` job takes several minutes: no Docker layer cache in CI] → It runs
  in parallel with `check`, which already takes longer. If it becomes the
  bottleneck, add `docker/build-push-action` with the GitHub Actions cache in a
  later fix.
- [`stack` is not a required check until the user changes branch protection, so
  a red `stack` would not block a merge] → The workflow follow-up in tasks.md asks the user to make it
  required once it is green on this PR.
- [Docker Desktop on Windows: line endings break `mvnw` inside the Linux image]
  → `.gitattributes` already forces LF for everything except `*.cmd`/`*.bat`; the
  Dockerfile also runs `chmod +x mvnw`.
- [Base image tags move within a minor version] → Accepted (D6). A broken
  upstream image shows up as a red `stack` job, not a silent change in production.
- [`docker compose config --format json` output differs between Compose
  versions] → `findComposeProblems` reads only stable keys (`services`,
  `healthcheck`, `ports`, `depends_on`, `volumes`, `image`, `build`); its tests
  use fixtures for both the short and the long `ports` form.

## Migration Plan

Additive only. Developers who do not use Docker keep the existing dev commands.
Rollback is reverting the PR; nothing persists outside the `db-data` volume,
which `docker compose down -v` removes.

## Implementation notes

- **nginx resolves `backend` per request** (D4): `proxy_pass` uses a variable with
  Docker's DNS (`resolver 127.0.0.11`) instead of the literal `http://backend:8080`.
  With the literal, nginx resolves the name once at start-up: `nginx -t` fails
  outside the compose network, and a recreated back-end container with a new
  address would get 502s until `web` restarts. The path is still passed unchanged.
- **Compose itself does not catch a missing health check:** with the back-end's
  health check removed, `docker compose config` still renders, although `web`
  waits for `backend` to be `service_healthy`. The gate's "no health check" rule
  is what fails it (negative probe in HANDOFF).
- **`scripts: unit tests` runs with `node --test`** on a quoted glob, so neither
  bash nor cmd expands it; Node 24 expands it itself.
- **The `stack` job** was confirmed to parse; that GitHub lists it is checked on
  the PR (workflow follow-up in tasks.md).
