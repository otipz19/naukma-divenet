# Proposal

## Why

The product is protected at the edges that were built deliberately: endpoints
deny by default (`SecurityRulesIT`), the refresh cookie is HttpOnly, Secure and
SameSite=Strict, and bcrypt signs in passwords. But two standard hardening
layers are missing. First, nothing audits the dependency tree: hundreds of npm
packages and the whole Spring Boot stack ship without a vulnerability check.
Second, nginx tells the browser nothing: the SPA's responses carry only
`Cache-Control`, with no CSP, no HSTS, no `X-Frame-Options`, no
`X-Content-Type-Options`. Both are cheap, both are what a reviewer looks for,
and both catch real problems. A full DAST suite (ZAP-style) is out of scope: at
this scale it mostly produces false positives and a slow CI job.

## What Changes

- Browser security headers on the web server: a strict `Content-Security-Policy`
  (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, and
  friends), `Strict-Transport-Security`, `X-Content-Type-Options`,
  `X-Frame-Options` and `Referrer-Policy`, applied to the SPA's HTML responses
  so the deployed app fails loudly if it relies on anything the policy forbids.
- The Playwright suite asserts the header set on the served app, so a weakened
  or broken policy cannot pass the gate silently.
- A dependency audit step in CI: `pnpm audit --prod --audit-level=high` over the
  frontend lockfile. Production dependencies with a high or critical advisory
  fail the check.
- A `security` CI job that builds the two stack images and scans them with
  Trivy, failing on unfixed HIGH or CRITICAL findings. Scanning the images
  covers the Java side too, because the backend image contains the Spring Boot
  jar and Trivy reads its dependency list, so no separate Maven CVE tool is
  needed.
- A roadmap row `harden-security` (M6), this proposal being the item that adds
  it.

Out of scope: DAST/fuzzing, runtime WAF rules, auth hardening (cookies are
already strict and are kept as they are), and anything the audits merely
report as low or medium severity.

## Capabilities

### New Capabilities

- `shared/security`: the two hardening layers around the product that CI keeps
  honest: audited production dependencies and browser security headers on the
  served app.

### Modified Capabilities

- `shared/e2e` gains no new journey requirements; the header assertions extend
  the existing stack-up check rather than adding a capability of their own.

## Impact

- `frontend/nginx.conf`: the header set, repeated in every location that defines
  its own `add_header` (nginx inheritance drops server-level headers there).
- `.github/workflows/check.yml`: the audit step in the `check` job, and the new
  `security` job (protected file, covered by the roadmap row).
- `e2e/src/stack-up.spec.ts`: header assertions.
- No application code, API, database or i18n changes.
- Nothing installs into the pnpm workspace: Trivy runs as a pinned container in
  CI, so the lockfile stays untouched.

## Plan updates absorbed

None.
