# Proposal

## Why

There is no front-end code yet, and every UI change from `add-authentication`
onwards needs the same foundation: a building React app in the pnpm workspace,
routing, server-state caching, `en`/`uk` translations, a typed API client
generated from `api/openapi.json`, and a front-end step in `pnpm check`. This is
the next M0 item in `docs/ROADMAP.md`.

The visual design does not exist yet. It will be mocked up with Claude Design and
written down as `docs/DESIGN.md`. So this change builds the plumbing only, with
**no UI**: no layout, navigation, styling or components beyond an unstyled
placeholder page that shows the wiring works.

## What Changes

- Add `frontend/` as a pnpm workspace member: Vite, React 19, TypeScript in
  `strict` mode, and React Router with a placeholder home route and a not-found route.
- Add TanStack Query with one shared `QueryClient`.
- Add `react-i18next` with the `en` (default and fallback) and `uk` locales. Pick
  the initial language from a saved choice or the browser language, and keep
  `<html lang>` in sync with it.
- Add the locale key-parity check, plus an ESLint rule that rejects hard-coded
  user-visible strings in JSX.
- Add generated API types (`openapi-typescript`, from `api/openapi.json`), a
  thin typed client (`openapi-fetch`) with base path `/api/v1`, and conversion of
  RFC 9457 error responses into one `ApiError` type. Add a check that fails when
  the generated types are stale.
- Add a Vite dev-server proxy for `/api` to the local back-end
  (`./mvnw spring-boot:test-run`).
- Add ESLint and Prettier (check mode), and Vitest with Testing Library and MSW.
- Add front-end steps to `scripts/check.mjs`: typecheck, lint, format check,
  i18n parity, API types freshness, unit tests and production build.
- **Roadmap adjustment:** the roadmap row says this change delivers an "app shell
  with disclaimer footer". That is UI, so it moves to a new M0 item,
  `add-app-shell` (layout, navigation, language switcher, safety disclaimer
  footer), which depends on `bootstrap-frontend` and `docs/DESIGN.md`.
  `add-authentication` (login and register UI) then depends on `add-app-shell`.
  The project rule that the footer shows the safety disclaimer
  (`docs/ARCHITECTURE.md`) is unchanged; only its delivery moves.
- **Boundary files:** this change edits `scripts/check.mjs` and `pnpm-lock.yaml`,
  which AGENTS.md lists as needing the user's approval. Approving this proposal
  approves those edits. `pnpm-workspace.yaml` already lists `frontend`, so it is
  not changed. CI already runs `pnpm install` and `pnpm check`, so
  `.github/workflows/check.yml` should need no change. If it turns out to need
  one, I will ask first.

Out of scope or deferred:
- All visual design and UI components: `add-app-shell`, after `docs/DESIGN.md`.
- The language switcher control: `add-app-shell`. This change has detection and
  persistence only.
- The map, feature pages and forms. React Hook Form, Zod and Leaflet come with
  the first change that uses them.
- E2E tests (Playwright, M6) and the nginx image (`add-local-stack`).

No user stories are covered directly. This is M0 foundation.

## Capabilities

### New Capabilities
- `shared/web-app`: the single-page app boots, routes the placeholder home and
  unknown paths, and shares one server-state cache.
- `shared/i18n`: the supported locales, initial language choice, the `<html lang>`
  attribute, locale key parity and the ban on hard-coded UI strings.
- `shared/api-client`: the typed client used for every call to `/api/v1`, and how
  error responses reach the UI.

### Modified Capabilities
- `shared/api-contract`: adds a requirement that the generated front-end types
  match `api/openapi.json`, with a check in the gate and a documented regenerate command.

## Impact

- New: `frontend/` (package manifest, Vite/TS/ESLint/Prettier/Vitest config,
  `src/app`, `src/i18n`, `src/api`, and tests).
- Changed: `scripts/check.mjs` (front-end steps), `pnpm-lock.yaml`,
  `docs/ROADMAP.md` (row text, new `add-app-shell` row, dependency change),
  `docs/ARCHITECTURE.md` (repository layout no longer marks `frontend/` as
  planned), `AGENTS.md` (code map, checks, fix commands), `README.md` (running
  the front-end), and `docs/HANDOFF.yaml`.
- No back-end, REST endpoint, Flyway migration or `api/openapi.json` changes.
- The gate gains Node-only front-end steps, which need no Docker.
