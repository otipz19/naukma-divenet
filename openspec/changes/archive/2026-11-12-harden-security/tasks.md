# Tasks

## 1. Browser security headers

- [x] 1.1 Add the header set from the design (CSP, HSTS, nosniff, X-Frame-Options, Referrer-Policy) to `frontend/nginx.conf` at server level, repeated in every location that declares its own `add_header` (`/media/`, the client-route fallback), and re-verify with a running stack that all document responses carry the full set.
- [x] 1.2 Run the full Playwright suite against the rebuilt stack and fix any page the CSP breaks (expected candidates: image previews via blob URLs, theme injection via emotion), adjusting the policy only if a journey proves a clause too strict.

## 2. E2E assertion

- [x] 2.1 Extend `e2e/src/stack-up.spec.ts` with a check of the served document's headers: the four protective headers plus the `default-src 'self'`, `script-src 'self'`, `frame-ancestors 'none'` and `object-src 'none'` clauses; confirm the check fails when a header is temporarily removed.

## 3. Dependency audit gate

- [x] 3.1 Add the audit step to the `check` job in `.github/workflows/check.yml`: `pnpm audit --prod --audit-level=high`, placed before the slower steps so a lockfile regression fails fast.
- [x] 3.2 Run the audit locally, resolve or explicitly accept whatever it reports (document the acceptance in the PR text, not in repo files), and confirm the gate passes on a clean tree.

## 4. Image scan gate

- [x] 4.1 Add the `security` CI job: build the backend and frontend images, scan each with the pinned Trivy container using `--severity HIGH,CRITICAL --ignore-unfixed --exit-code 1`, and confirm the job passes on the branch.
- [x] 4.2 If the scan finds fixable high or critical findings, fix them inside this change (version bumps first, workarounds only if a bump is impossible).

## 5. Docs, spec sync, archive

- [x] 5.1 Document the new gate in the README's testing section (what runs where, how to run the audit and scan locally) and update `docs/HANDOFF.yaml`.
- [x] 5.2 Add the `harden-security` row to `docs/ROADMAP.md` as in-progress at proposal time, flip it to archived when done.
- [x] 5.3 Sync the `shared/security` spec into `openspec/specs/`, validate everything with `openspec validate --all --strict`, run `pnpm check` end to end, and archive the change.
