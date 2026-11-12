# Tasks

## 1. k6 suite

- [x] 1.1 Create `perf/package.json` (outside the pnpm workspace) with pinned
  `lighthouse` and `chrome-launcher` devDependencies, and `perf/scripts/` for the
  k6 scenarios. Verify: `npm install` in `perf/` succeeds without touching the
  root `pnpm-lock.yaml`.

## 2. Shared stack plumbing and the checks

- [x] 2.1 Extract the shared stack plumbing from `scripts/run-e2e.mjs` into
  `scripts/stack.mjs` (compose runner factory, seed wait, image pulls) and
  rewrite `run-e2e.mjs` to import it; no behavior change. Verify: the scripts
  unit tests (`node --test scripts`) still pass and `pnpm test:e2e` still runs
  green (a spot run of the smoke spec is enough).
- [x] 2.2 Write the k6 scenarios in `perf/scripts/`: `site-search`
  (`/api/v1/sites/markers`), `site-details` (one seeded site's details, reviews
  and warnings), `feed` (`GET /api/v1/posts`) and `login` (demo credentials),
  each a `ramping-vus` profile with the p95 and error-rate thresholds of
  design D2. Verify: `k6 run` against a manually started stack prints each
  scenario's p95 and error rate and passes.
- [x] 2.3 Write the Lighthouse check (`perf/scripts/lighthouse.mjs`): runs
  against the stack's web server on `/` and one seeded site page, asserts the
  D4 budgets, exits non-zero naming any crossed budget. Verify: run against the
  stack prints the measured metrics and passes.

## 3. Runner

- [x] 3.1 Write `scripts/run-perf.mjs` on `scripts/stack.mjs`: compose project
  `divenet-perf`, web port 18082, fixed admin credentials, pull with retries,
  retrying `up --wait`, seed wait, then k6 (found on the PATH; a missing binary
  fails fast with the install hint) and the Lighthouse check, always
  `down -v`, and a per-scenario pass/fail summary; add `test:perf` to the root
  `package.json`. Verify: `pnpm test:perf` on a clean machine state starts the
  stack, runs both checks, prints the summary, and leaves nothing
  (`docker compose -p divenet-perf ps` is empty).

## 4. CI

- [x] 4.1 Add the `perf` job to `.github/workflows/check.yml`: Node 24, the
  k6 setup action pinned by tag, install `perf/` and Chromium, run
  `node scripts/run-perf.mjs`, upload the output as a workflow artifact.
  Verify: the workflow YAML is valid and the job is green on the change
  branch's PR.

## 5. Docs and gate

- [x] 5.1 Add the `measure-performance` row to `docs/ROADMAP.md` (M6, status
  `in-progress` at apply start), document `pnpm test:perf` in `README.md` next to
  `pnpm test:e2e`, and update `docs/HANDOFF.yaml`. Verify: files updated and
  consistent.
- [x] 5.2 Run `pnpm check` from the repository root and confirm every step
  passes (the performance suite itself is not part of the gate). Verify: green
  gate output.

## Workflow follow-up

- Sync the `shared/performance` delta spec into `openspec/specs/`, run
  `openspec validate --all --strict`.
- Archive the change on this branch (`/opsx:archive`), set the roadmap status
  to `archived` in the same commit, then push and open the PR to `master`.
