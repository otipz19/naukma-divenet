# Design

## Context

The E2E suite (`add-e2e-suite`) already starts the real compose stack under a
dedicated project, waits for the demo seed and tears everything down. That
runner proved two things this design reuses: compose reports *healthy* before
the `ApplicationRunner`s finish, and a dedicated project + port keeps parallel
stacks from colliding. Performance measurement needs the same shape, pointed at
throughput instead of journeys.

## Goals / Non-Goals

Goals: pass/fail thresholds a human can read, numbers a reviewer can
cite, a run that never leaves a stack behind.

Non-goals: locating the cause of a slow endpoint (measurements only; fixes are
follow-up changes), soak or spike profiles beyond the declared steady loads, and
any change to application code.

## Decisions

**D1: k6 scenarios mirror how the map is used.** Three read scenarios
(`site-search` for `/api/v1/sites/markers` with a query, `site-details` for one
seeded site's details + reviews + warnings, `feed` for `/api/v1/feed`-style
public listing) and one auth scenario (`login` posting real demo credentials).
Reads dominate a real visitor's traffic; login is the only write-ish path worth
loading at this level. Alternative considered: JMeter, rejected as JVM-heavy
and alien to this Node repo; k6 scripts are plain JavaScript and run as a single
binary.

**D2: thresholds on p95 and error rate, generous enough for CI noise.**
`p95` per scenario, calibrated with all four scenarios running concurrently
(80 VUs total): 1200 ms for the three read scenarios, 2000 ms for `login`
(bcrypt dominates and needs the most headroom). The first CI run showed the
2-vCPU runner measures ~750 ms for reads where a dev box measures ~350 ms, so
the budgets hold the slowest machine class the suite runs on. Error rate: below
1% everywhere. These are budgets of a demonstrable product, not production
SLAs; thresholds only tighten in a follow-up change, never mid-implementation.

**D3: steady load, not a fixed request count.** Each scenario ramps to ~20
concurrent virtual users over 30 s, holds 60 s and ramps down (default k6
executor `ramping-vus`). A fixed-request run answers "how long does one call
take" (already covered by E2E); a duration-based run answers "does it hold up".

**D4: Lighthouse with assertions, against the stack's web server.**
Lighthouse (JS API, not the CLI — its path moved in v13) runs on `/` and on one
seeded site page, asserting first contentful paint below 3 s, largest contentful
paint below 5 s and total page weight below 1.5 MB. The budgets are calibrated
with Lighthouse's default 4x CPU throttling on the Docker-VM dev setup (measured:
FCP 2.6 s, LCP 4.7 s, weight 480 kB); TBT is excluded because it depends on the
host's CPU speed. A crossed budget fails the whole run. Alternative considered:
Lighthouse CI with its own server — rejected because the stack is the server and
must be the thing measured.

**D5: one runner, `scripts/run-perf.mjs`, `pnpm test:perf`.** The same shape as
`run-e2e.mjs`: compose project `divenet-perf`, web port 18082, env from
`.env.example` with fixed admin credentials, image pulls with retries, retrying
`up --wait`, the seed wait, run k6 and Lighthouse, always `down -v`. The seed
wait moves from `run-e2e.mjs` into a small shared module (`scripts/stack.mjs`)
that both runners import, instead of duplicating it.

**D5a: k6 runs as a container on the stack's network.** Calibration showed the
host's path into the stack is not a measurement instrument: Docker Desktop's
Windows port-forward drops connections at ~80 concurrent (instant 502s from the
proxy, invisible to the container's own logs), so the suite would measure the
host's port-forward, not the product. The runner therefore starts the pinned
`grafana/k6` image on the stack's network against `http://web`, which measures
the product the way CI (Linux) and a real deployment see it. Lighthouse, a
single-page cold load, stays on the host through the published web port with the
system's Chrome (`CHROME_PATH`); its devDependencies live in `perf/package.json`,
which stays **outside** the pnpm workspace so the app's lockfile is untouched.

**D6: the summary is the artifact.** k6's end-of-test summary and Lighthouse's
scores are printed by the runner with a pass/fail line per scenario; CI uploads
the text output as a workflow artifact so a reviewer can cite the numbers
without rerunning.

## Risks / Trade-offs

- [Shared runners are noisy; thresholds may flake] → budgets are p95-based and
  generous (D2); if the CI job still proves flaky, thresholds are loosened in a
  plan-update note rather than the job being disabled.
- [The host port-forward may still flake for Lighthouse] → Lighthouse is one
  cold page load, not sustained concurrency, which the proxy handles fine
  (the k6 host runs failed at ~80 concurrent connections, never at one).
- [A slower stack in CI crosses a Lighthouse budget that local runs meet] →
  budgets are on the SPA's own metrics, not network-dependent ones; TBT is
  intentionally excluded for this reason.
- [Duplicating the e2e runner drifts] → the seed wait and stack plumbing are
  factored into `scripts/stack.mjs` (D5), and the runner keeps the same step
  order so a future fix lands in one place.

## Migration Plan

Test-only: nothing deploys. Rollback is deleting `perf/` and the job.

## Open Questions

None blocking; the exact threshold values may be tuned within a factor of two
during calibration without reopening this design.
