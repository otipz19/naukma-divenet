# Design

## Context

The stack runtime and its smoke test already exist (spec `shared/local-stack`,
`scripts/smoke-stack.mjs`): an isolated compose project (`divenet-smoke`,
web port 18080), image pulls with retries, health-gated start, guaranteed
teardown. The SPA keeps the access token in memory only and silently refreshes
via the `HttpOnly` refresh cookie on 401; the token lives 15 minutes.
Demo seed: 51 sites, 8 divers (`…@demo.divenet.test`, password
`divenet-demo`); the admin comes from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

## Goals / Non-Goals

Goals: journeys through the real UI against the real stack; a single command;
a CI job; deterministic runs.

Non-Goals: cross-browser CI (Chromium only; Firefox/WebKit usable locally),
visual regression, performance measurement, accessibility auditing (later
changes may extend the suite), any change to product behaviour, API, migrations
or i18n.

## Decisions

- **D1 — New `e2e/` workspace package.** Playwright + TypeScript, its own
  `package.json` (pinned versions), added to `pnpm-workspace.yaml`. Keeps E2E
  deps out of the SPA bundle and its gate steps. Alternative rejected: putting
  Playwright inside `frontend/` — it would slow every `pnpm --filter frontend`
  install and blur unit vs E2E.
- **D2 — Root runner script, smoke-stack pattern.** `scripts/run-e2e.mjs`
  starts the stack as compose project `divenet-e2e` on web port **18081**
  (never colliding with a developer stack or the smoke project), reusing
  `compose-rules.mjs` helpers and the pull-with-retries approach, runs
  `playwright test`, and always tears down with `-v`. Exposed as
  `pnpm test:e2e`. Journeys get the base URL from an env var the runner sets.
  Admin credentials: the runner copies `.env.example` and overrides
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` with fixed test values, so journeys can log in
  as the admin without a committed secret.
- **D3 — Session-refresh journey without waiting 15 minutes.** Login, then a
  full page reload: the SPA loses the in-memory access token, so the next
  authenticated request must silently refresh through the real cookie. This
  exercises exactly the F4 flow (cookie → new token → still logged in) in
  seconds. Shortening the token lifetime via a new env var was rejected: it
  would add product configuration and a `.env.example` entry for a test-only
  need; the reload covers the same code path.
- **D4 — Selectors by role, not test ids.** Journeys locate elements with
  accessible roles, names and labels (the app already has 43+ `aria-label`s
  and semantic controls). No `data-testid` attributes are added to the app:
  the suite observes the product, it does not change it.
- **D5 — Map journeys avoid tile flakiness.** Leaflet tiles come from
  OpenStreetMap over the internet. Journeys assert on the seeded result list
  and site links (deterministic), treat markers as present when the cluster
  layer reports them, and never wait on tile images.
- **D6 — One spec file per journey**, minimal shared helpers (login, base URL,
  demo credentials) in `e2e/src/support/`. Traces/screenshots on retry;
  Playwright's default retry stays off locally, one retry in CI.
- **D7 — CI job `e2e`** in `.github/workflows/check.yml`: Node 24, no pnpm
  install needed by the runner itself, `docker` is preinstalled on
  `ubuntu-latest`; step runs `node scripts/run-e2e.mjs`. Playwright browsers
  install via the package's own postinstall/`npx playwright install chromium`
  step, cached on the workflow's hash of the lockfile. The job is separate
  from `check` and `stack`, which stay untouched.

## Risks / Trade-offs

- [Journey flakiness from async seeding] → the runner waits for stack health
  and the journeys use seeded, known data; retries limited to one in CI.
- [External map tiles make CI dependent on OSM] → D5: nothing asserts on
  tiles; journeys pass with tiles blocked.
- [Windows Docker Desktop differences] → the runner is plain Node + `docker
  compose`, same as the smoke test, which the team already runs on Windows.
- [Two long CI jobs in parallel (`stack`, `e2e`) slow PR feedback] → accepted;
  both are parallel to `check`, which stays the fast gate.
- [Playwright version churn] → pinned exact version in `e2e/package.json`,
  committed lockfile.

## Migration Plan

Additive only: new package, script and CI job. Rollback = delete the job and
package. No product data or API affected.

## Open Questions

None.
