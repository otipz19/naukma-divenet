# Proposal

## Why

The product is feature-complete and every layer below the browser is well tested
(≈441 backend, ≈383 front-end, a compose smoke test), but nothing exercises the
real chain a user faces: browser → nginx → back-end → PostGIS/MinIO. The course
plan (PR1) promises E2E testing, the roadmap lists `add-e2e-suite` as the next
M6 item, and the review found a concrete risk only E2E can guard: the
`Secure` refresh cookie silently drops sessions on a non-localhost HTTP demo
host, and no test today drives a login through a real browser cookie jar.

## What Changes

- Add a Playwright E2E suite in a new `e2e/` workspace package (added to
  `pnpm-workspace.yaml`), running against the real compose stack with the demo
  seed (`SPRING_PROFILES_ACTIVE=demo`), not against mocks.
- Cover the critical user journeys:
  - anonymous: browse the map, open a site page with reviews and warnings;
  - register a new user, log in, write a review with a photo;
  - log in as a demo diver, add a dive-log entry, see the achievement banner;
  - write and publish a post, see it in the global feed;
  - admin: open the moderation queue and approve a submitted site;
  - **session survives an access-token refresh** in a real browser (the F4
    guard: login, wait out/force the 15-minute expiry window via the refresh
    flow, keep using the app).
- Add a `pnpm test:e2e` script plus a wrapper that builds and starts the stack
  (reusing the smoke test's project/port isolation pattern), runs Playwright,
  and always tears it down.
- Add a third CI job `e2e` to `.github/workflows/check.yml` that runs the suite
  on every push and PR, Chromium only (Firefox/WebKit stay available locally
  but are not required in CI to keep the job fast).
- The suite is **not** part of `pnpm check` (it needs Docker and takes minutes,
  like `stack`).

## Capabilities

### New Capabilities

- `shared/e2e`: end-to-end journeys that run the real stack in a browser and
  verify the product works the way it is demonstrated, including that a login
  session survives token refresh and that CI runs the suite.

### Modified Capabilities

None. `shared/local-stack` already covers stack bring-up and the smoke test;
the E2E suite reuses that runtime and adds its own capability rather than
changing stack requirements.

## Impact

- New `e2e/` package: Playwright (pinned version), specs, a small page-object /
  helper layer, `playwright.config.ts` targeting the compose web port.
- `pnpm-workspace.yaml`: add `e2e` to `packages` (a protected file; this change
  edits it with the user's approval).
- `.github/workflows/check.yml`: new `e2e` job (a protected file; same approval).
- Root `package.json`: `test:e2e` script (protected file; same approval).
- No API, database, i18n or front-end behaviour changes; no new endpoints,
  migrations or UI strings. The suite only observes existing behaviour.
- CI runtime grows by one job (est. 5–10 min, parallel to `check` and `stack`).

## Plan updates absorbed

None. `docs/plan-updates/add-e2e-suite/` does not exist.
