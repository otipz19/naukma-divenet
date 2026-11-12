# Proposal

## Why

The stack ships and every feature is now verified end to end, but nothing
measures how the product behaves under load or how fast the SPA renders: the
only numbers we have are anecdotes. This change introduces performance testing:
repeatable load tests against the real compose stack with pass/fail thresholds,
plus a front-end performance budget check, both runnable locally and in CI.

## What Changes

- A k6 load-test suite (`perf/`) driving the public read paths of the real
  compose stack: site markers (the map search), site details with reviews and
  warnings, and the feed, plus an authenticated login burst. Each scenario
  declares thresholds (p95 latency, error rate) that make the run pass or fail.
- A runner script `scripts/run-perf.mjs` (the pattern of `run-e2e.mjs`): starts
  the stack under compose project `divenet-perf` on port 18082, waits for the
  demo seed, runs k6 and a Lighthouse check of the SPA, always tears the stack
  down, and prints a human-readable summary. Exposed as `pnpm test:perf`.
- A Lighthouse performance check of the SPA with budget assertions (first
  contentful paint, largest contentful paint, total page weight) so a front-end
  regression fails loudly instead of silently drifting.
- A CI job `perf` in `.github/workflows/check.yml`, like `stack` and `e2e`: it
  needs Docker and minutes, so it stays outside `pnpm check`.
- A roadmap row `measure-performance` (M6), this proposal being the item that
  adds it.

Out of scope: accessibility auditing (axe-core belongs to `polish-release`),
backend profiling or tuning work (this change measures and reports; fixes are
follow-ups), and soak/peak-hour stress profiles beyond the declared thresholds.

## Capabilities

### New Capabilities

- `shared/performance`: repeatable performance measurement of the running stack:
  load tests with thresholds against the public API, a front-end performance
  budget, one command that runs both against a fresh stack, and CI keeping them
  green.

### Modified Capabilities

None. The read endpoints, the SPA and the stack behave the same; this change
only observes them.

## Impact

- New top-level `perf/` directory (k6 scripts in JavaScript, no new package in
  the pnpm workspace: k6 runs as a binary; Lighthouse runs through `npx`-free
  pinned devDependencies of a small `perf/package.json` that stays outside the
  workspace).
- New scripts `scripts/run-perf.mjs`; new root script `test:perf`.
- `.github/workflows/check.yml` gains the `perf` job (protected file, covered by
  this change's roadmap row).
- No application code, API, Flyway migration or i18n string changes.
- New devDependency on k6? No: k6 is a downloaded binary (CI installs it via
  its official setup; locally the runner checks for it and tells the user how
  to install), so the lockfile stays untouched.

## Plan updates absorbed

None.
