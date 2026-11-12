# Design

## Context

The web server (`frontend/nginx.conf`) serves the built SPA and proxies `/api/`
and `/media/`. CI has four jobs (`check`, `stack`, `e2e`, `perf`); anything
needing Docker or minutes stays outside `pnpm check`, following the pattern of
the other suites. The header work has one foot in `pnpm check` (the Playwright
suite is a CI job) and the audits sit between the two gates: the npm audit is a
fast registry query, the Trivy scan needs images built.

## Goals and Non-Goals

Goals:

- A content security policy tight enough to be worth asserting.
- Dependency auditing for both ecosystems, in one CI job class, with no new
  tool installed into the workspace.
- Every check fails loudly and locally reproducible.

Non-goals:

- DAST, fuzzing, or penetration testing.
- Changing auth behavior. The refresh cookie (HttpOnly, Secure, SameSite=Strict)
  and Spring Security rules stay as verified by `SecurityRulesIT`.
- Renovating low and medium advisories. The audit gates on high and critical.

## Proposed Solution

**D1: header set, defined once, repeated where nginx drops it.**

The policy covers what the app actually does, nothing more:

```
Content-Security-Policy: default-src 'self'; script-src 'self';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
  font-src 'self'; connect-src 'self'; object-src 'none';
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

- `style-src 'unsafe-inline'` is required: MUI's emotion injects `<style>`
  elements at runtime. Scoping styles further (hashes, nonces) buys nothing
  against the realistic threat (script injection) and breaks theming.
- `img-src` allows `data:` (inline placeholder graphics) and `blob:` (photo
  previews through object URLs).
- `script-src 'self'` holds: the Vite build emits no inline scripts. If a future
  change wants one, the policy must change too, which is the point of a
  policy you assert.
- HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and
  `Referrer-Policy: strict-origin-when-cross-origin` complete the set. HSTS is
  ignored by browsers on plain HTTP, so the local stack carries it harmlessly
  and it starts working the moment the app is served over TLS.

nginx inherits `add_header` from the server block only into locations that
declare none of their own. `/media/` and the client-route fallback already set
`Cache-Control`, so the header lines are duplicated there rather than lost.
The backend's API responses get the headers only where nginx adds any (the API
proxies add none today, so the server-level set reaches them); the browser
policy is a statement about the document, and the API serves JSON, not HTML.

**D2: the Playwright suite asserts the policy, not the absence of CSP.**

A check in `stack-up.spec.ts` requests the landing page and asserts the
required header names and the load-bearing policy parts (`default-src 'self'`,
`script-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`). It asserts
presence and the restrictive clauses; it does not diff the whole string, so
adding an allowance later (documented in the spec) does not break the test,
while removing a protection does.

**D3: audits where the artifacts live.**

- Frontend: `pnpm audit --prod --audit-level=high` as a step of the `check` job.
  It runs on the lockfile in seconds and needs no build. Production
  dependencies only: a devDependency advisory is not a shipping vulnerability.
- Both ecosystems: the `security` job builds the two images and runs Trivy
  (`aquasec/trivy` pinned tag) with `--severity HIGH,CRITICAL --ignore-unfixed
  --exit-code 1`. `--ignore-unfixed` keeps the gate meaningful: it fails on
  findings with an available fix, not on upstream silence. The backend image
  scan reads the Spring Boot jar's dependency list through Trivy's Java DB, so
  the Maven side needs no separate slow tool (the usual OWASP
  dependency-check spends minutes downloading the NVD and still misses things).
- Like `stack`/`e2e`/`perf`, the `security` job is outside `pnpm check`: it
  needs Docker and image builds.

**D4: locally runnable, same as the other suites.**

The headers are verifiable with `pnpm test:e2e`. The audit is one command
(`pnpm audit --prod`) and the Trivy scan is one command against built images,
documented in the README's testing section; no new local tooling is required,
because Trivy runs as a container if the user has Docker.

## Risks and Trade-offs

- **CSP can break a UI silently in other browsers.** Mitigated the same way as
  every other regression here: the Playwright suite runs against the full app
  under the new headers, and the journeys cover every page class (feed, map,
  dive log, reviews, admin). Chromium does not report CSP violations as test
  failures on its own; the journeys assert the pages still work, which is
  the observable half, and the policy is the preventive half.
- **`--ignore-unfixed` under-reports.** Accepted deliberately: the gate's job
  is to catch things that can be fixed now, and a permanently failing CI on
  an upstream-fixed-tomorrow CVE teaches people to ignore the gate.
- **`style-src 'unsafe-inline'` weakens one clause.** Accepted: script
  injection, not style injection, is the realistic threat, and MUI's runtime
  style injection has no cheaper compatible option.

## Migration Plan

Apply inside one change: headers, e2e assertions, CI steps, docs. The stack is
rebuilt; no data or migration concerns. Nothing in the sequence depends on
another change in flight.

## Open Questions

None. Trivy's image build doubles the image build cache warmth for `stack`/
`e2e`/`perf`, and its first CI run may need the same one-at-a-time debugging the
`perf` job needed; that is expected and does not change the design.
