# Tasks

## 1. Images

- [x] 1.1 Set `add-local-stack` to `in-progress` in `docs/ROADMAP.md`. Add
  `backend/Dockerfile` and `backend/.dockerignore` (D3). Verify with
  `docker build backend` that the image builds, and that
  `docker run --rm <image> java -version` reports Java 25.
- [x] 1.2 Add `frontend/Dockerfile`, `frontend/nginx.conf` and the root
  `.dockerignore` (D4). Verify with `docker build -f frontend/Dockerfile .` that
  the image builds, and that `docker run --rm <image> nginx -t` reports the
  configuration as valid.

## 2. Compose stack (`shared/local-stack`)

- [x] 2.1 Add `compose.yaml` (D1, D5, D6) and `.env.example` (D2). Verify by hand:
  `docker compose --env-file .env.example up --build --wait` exits 0, then
  `http://localhost:8080/` shows the home page in a browser, and
  `curl -i http://localhost:8080/api/v1/does-not-exist` returns a 404 problem
  detail. Tear down with `docker compose down -v`.

## 3. Gate check of the configuration (`shared/local-stack`)

- [x] 3.1 Add `scripts/compose-rules.mjs` with `findComposeProblems` (D7) and
  `scripts/compose-rules.test.mjs` (`node:test`). Cover these fixtures:
  - the real rendered configuration passes;
  - a service without a health check fails and is named (scenario "Gate rejects
    a broken configuration");
  - `depends_on` with `service_started` fails (scenario "Start order follows
    health");
  - a port published on `db` or `backend` fails, and `web` with two ports fails
    (scenario "Published ports");
  - `db` data on a bind mount instead of a named volume fails;
  - `image: postgis/postgis`, `:latest` and a `FROM node` line each fail and are
    named (scenario "Unpinned image is rejected");
  - `ports` in both the short and the long form are read.

  Verify with `node --test "scripts/**/*.test.mjs"`.
- [x] 3.2 Add `scripts/check-compose.mjs`, which renders the three configurations
  in D7 with a scrubbed environment. Verify that it passes on the repository,
  covering the scenarios "Missing password is rejected" and "Web port is
  configurable". Then run two negative probes and record them in HANDOFF, each
  reverted afterwards:
  - remove the `backend` health check: the check fails and names `backend`;
  - publish `5432` on `db`: the check fails and names `db`.
- [x] 3.3 Add the gate steps `scripts: unit tests` (`node --test
  "scripts/**/*.test.mjs"`) and `compose: configuration`
  (`node scripts/check-compose.mjs`) to `scripts/check.mjs`, after the design
  tokens step (approved with the proposal). Verify that `pnpm check` runs and
  passes them.

## 4. Smoke test of the running stack (`shared/local-stack`)

- [x] 4.1 Add `scripts/smoke-stack.mjs` with an exported `runSmoke(run, http)`
  (D8), and `scripts/smoke-stack.test.mjs`. With fake runners, the tests cover:
  - all checks passing exits 0 and calls `down -v --remove-orphans` last;
  - a failing HTTP check exits non-zero, still tears down, and prints the logs;
  - a failing `up` still tears down (scenario "Smoke test cleans up").

  Verify with `node --test "scripts/**/*.test.mjs"`.
- [x] 4.2 Add the root script `"smoke:stack": "node scripts/smoke-stack.mjs"` to
  `package.json` (approved with the proposal). Run `pnpm smoke:stack` locally.
  Verify that it passes, covering the scenarios "Stack becomes healthy", "Home
  page", "Client-side route", "Built asset", "API error comes from the back-end"
  and "Restart keeps the migration history". Verify also that afterwards
  `docker ps -a` and `docker volume ls` show nothing from `divenet-smoke`.

## 5. CI and docs

- [x] 5.1 Add the `stack` job to `.github/workflows/check.yml` (D9; approved with
  the proposal). Verify that the YAML parses and that the job is listed when the
  PR's checks start.
- [x] 5.2 Update the docs:
  - README "Running the app": the compose runbook (`cp .env.example .env`,
    `docker compose up --build`, the URL, `down` / `down -v`) and the
    `pnpm smoke:stack` command.
  - `docs/ARCHITECTURE.md`: remove the **(planned)** marks on `compose.yaml`, and
    note that only the web port is published.
  - AGENTS.md:
    - the Checks list: the two new gate steps, and the `stack` CI job;
    - Boundaries: replace the `.env` placeholder with the rule that `.env` is
      never committed and every new variable is added to `.env.example`
      in the same change;
    - Fix commands: `pnpm smoke:stack`.

  Verify that every command in the new README section runs as written.

## 6. Verification

- [x] 6.1 Run `pnpm check` from the repository root and verify that it ends with
  "All checks passed.".
- [x] 6.2 Update `docs/HANDOFF.yaml` (state, last check, negative probes) and
  verify that it is under 40 lines with `next` set. The roadmap status becomes
  `archived` in the archive commit, not here.

## Workflow follow-up

- Archive on this branch right after 6.2 (`/opsx:archive`), setting the roadmap
  status to `archived` in the archive commit; then push and open the PR.
- Once the PR is open, confirm that both `check` and `stack` are green on it.
  Then ask the user to add `stack` as a required status check on `master`. That
  is a repository setting, and agents do not change it.
