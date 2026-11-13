# Design

## Context

The E2E suite already runs every journey against the real stack with role-based
selectors, which is the right substrate for an axe audit: pages are audited in
their rendered, data-carrying state, not in storybook isolation. axe-core via
`@axe-core/playwright` injects the scan into a live `Page`. The suite runs in
CI's `e2e` job today; the audits ride it with no workflow change.

## Goals and Non-Goals

Goals:

- One audit helper, one policy, every routed page scanned.
- Fail loudly on critical and serious violations; report the rest.
- Accepted exceptions are explicit, listed, and reasoned.

Non-goals: manual AT testing, AAA rules, flow redesign.

## Proposed Solution

**D1: one helper, page lists, not per-spec copies.**

`e2e/src/support/audit.ts` exports `expectAccessible(page, options)`:
injects axe, runs with `tags: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]`,
splits violations by impact. `critical`/`serious` fail the test with axe's own
failure summary (rule id, impact, target selector, help URL); `moderate`/`minor`
are printed to the test output as a report. The accepted-exceptions list lives
in that same file: a map of `{ ruleId, target-ish reason }` that filters
violations before the assert, so an accepted violation is visible in one place
and deleting the entry re-activates the rule — the same trick the security
header assertions use.

**D2: audit pages through journey flows, with data.**

Each audit spec navigates like the journeys do (real login, real seeded data),
then asserts the page accessible. Scans run on: map, catalog, site details,
login, register, dive log, dive log entry form, achievements, post editor,
feed, post page, review form, warning form, profile, gear locker, certificates
(both states: verified and unverified), admin moderation as admin. Two extra
dimensions where they change the render: both themes (the theme toggle sets
`data-` attribute/`class`, no reload — scan after toggle) and `uk` locale for
the pages with translated chrome. Contrast rules in dark and light themes are
where theme-scanning pays; locale scanning catches missing or untranslated
labels that leave elements unnamed. Each page is scanned in at most two states
(default theme + dark; default locale + uk) — not the full matrix, which would
quadruple suite time for marginal signal.

**D3: the policy is a floor, enforced both ways.**

The suite fails on unaccepted critical/serious findings. It also fails if an
accepted exception stops matching anything (the filter is keyed by rule id and
a selector fragment; a stale entry fails with "accepted violation no longer
present — remove it"), so the exception list cannot rot into a permanent
allow-all. This mirrors how the image scan's acceptance would be handled.

**D4: triage inside the change.**

Expected finding classes, from the stack in use: MUI components are generally
clean; the risk areas are the map (canvas/svg markers with title-only naming),
the photo and video dropzones (drag-hint text not associated with the input),
color-only status chips (draft/published, warning severity) that may rely on
color alone, and contrast of muted text over the seeded photos. Triage rule:
fix what a rule demands (labels, roles, contrast tokens — small diffs in
markup or `design/system` tokens); declare accepted for anything requiring a
flow change, with the reason and the follow-up change named in the tasks. The
proposal's constraint holds: no behavior redesign mid-audit.

**D5: dependency.**

`@axe-core/playwright` version-pinned to match the suite's Playwright 1.65.0
(the package tracks Playwright versions). Dev-only in `e2e/package.json`; no
workspace-wide changes.

## Risks and Trade-offs

- **axe misses what only a human or AT catches.** Accepted: this is the
  automatable floor, not a certification. The accepted-exceptions list records
  where manual testing is still owed.
- **Flaky audits on animated content.** axe ignores animation; waits come from
  the existing journey fixtures (assertions on visible content before the
  scan), so no new wait logic is introduced.
- **Suite time grows.** ~20 scans at a few hundred ms each against a running
  page: seconds, not minutes; the suite keeps its 90s-per-test timeout.

## Migration Plan

Apply in one change: helper, specs, triage fixes/acceptances, lockfile, README
sentence. No sequence dependency on other work.

## Open Questions

None.
