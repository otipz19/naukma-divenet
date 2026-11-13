# Proposal

## Why

Every quality dimension the project measures — functional behavior, load,
front-end performance, dependency and image vulnerabilities — is kept green by
a declared, automated gate. Accessibility is the exception: pages are built
with semantic markup and the journeys use role-based selectors (which proves
some roles resolve), but nothing scans systematically, so a regression that
removes a label, breaks contrast or traps keyboard focus would pass every gate.
This change closes that gap: automated accessibility audits of the real rendered
pages in the existing E2E suite, with a declared pass/fail policy, triaged and
either fixed or accepted with written reasoning.

## What Changes

- axe-core integrated into the Playwright suite: each audited page is scanned
  in its rendered state against the WCAG 2.1 A and AA rule sets (the standard
  axe tags), in both color themes and in the `uk` locale for the pages whose
  text changes with locale.
- A declared violation policy: audits fail on violations of impact `critical`
  or `serious`; `moderate` and `minor` findings are reported into the test
  output but do not fail the suite. Accepted exceptions (if any audit rule
  cannot be satisfied yet) are declared in one visible list with reasons, not
  silently skipped.
- Every routed page of the app is audited: the map, site catalog, site details,
  auth pages, dive log, achievements, posts and feed, review and warning forms,
  profile, gear locker, certificates, and the admin moderation page — reached
  through the existing journey fixtures so the pages are audited with real
  data, including an authenticated admin state.
- Findings are triaged: each `critical`/`serious` violation is either fixed in
  this change (markup, labels, contrast tokens) or moved to the accepted list
  with a reason. The suite is green only with zero unaccepted critical/serious
  findings.
- A roadmap row `audit-accessibility` (M6), this proposal being the item that
  adds it.

Out of scope: full manual screen-reader and keyboard-only journey testing
(the axe scan covers the automatable subset), auditing beyond WCAG 2.1 A/AA
( no AAA), and redesigning flows the audits flag as legal-but-awkward.

## Capabilities

### New Capabilities

- `shared/accessibility`: automated accessibility audits of the rendered app
  with a declared pass/fail policy, run with the E2E suite and kept green in
  CI.

### Modified Capabilities

None. The E2E capability keeps its meaning; this adds an audit alongside the
journeys, reusing the same runner and stack.

## Impact

- `e2e/`: new audit specs and a small axe-core runner helper; `@axe-core/playwright`
  added to the `e2e` package (lockfile change, dev-only).
- Frontend fixes where triage lands on real defects (markup, ARIA labels,
  contrast tokens in `design/system`): smallest possible diffs, no behavior or
  i18n changes beyond label text that a rule requires.
- No API, database or CI-workflow changes: the audits ride the existing `e2e`
  job and `pnpm test:e2e`.
- README's testing section gains one sentence naming the audit.

## Plan updates absorbed

None.
