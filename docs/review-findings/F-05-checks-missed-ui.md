# F-05 The checks miss console errors and layout defects

- **Area:** Tests (e2e)
- **Status:** declined (owner, 2026-11-21)
- **Delivered by:** none

## Decision
No new automated checks for now: the priority is to review and fix for the demo, and
extra suites would slow that down. Fixes still come with the tests the gate already
requires (a test per spec scenario). This file stays as the record of the gap.

## Seen
F-02, F-03, F-04 and F-12 all reached `master` with a green gate and green e2e,
a11y and perf jobs.

## Cause
The suites check that content and controls exist and are accessible. They do not
check how the page behaves on screen:
- no journey fails on console errors or CSP violations (F-02);
- nothing asserts that a full-height page does not scroll, at desktop or phone size
  (F-03, F-12);
- nothing compares the widths of form inputs (F-04).

## Fix
- A shared Playwright fixture in `e2e/src/support` that fails a test on any console
  error or `securitypolicyviolation` event. It keeps an explicit allow-list with a
  stale-entry check, like the a11y `ACCEPTED` list. Until F-01 lands, the signed-out
  refresh 401 is allowed.
- Map page: at 1280×800 and 390×844, assert
  `document.documentElement.scrollHeight <= innerHeight`.
- Forms: on `/login` and `/register`, the inputs share one width.
