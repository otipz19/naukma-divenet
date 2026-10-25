# Tasks

## 1. Package scaffolding

- [x] 1.1 Set `bootstrap-frontend` to in-progress in `docs/ROADMAP.md`. Create
  `frontend/package.json` with the scripts from design D1 and pinned dependencies
  from D3 (TypeScript 6.0.x). Verify that `pnpm install` from the root succeeds and
  updates `pnpm-lock.yaml`.
- [x] 1.2 Add the configuration files: `tsconfig*.json` (strict), `vite.config.ts`
  (React plugin, `/api` proxy per D9), `vitest.config.ts` (jsdom, `src/test/setup.ts`
  with jest-dom and an MSW server using `onUnhandledRequest: "error"`),
  `eslint.config.js`, `.prettierrc.json` and `.prettierignore`. Then add `index.html`
  and a minimal `src/main.tsx`. Verify that `typecheck`, `lint`, `format:check` and
  `build` pass on the empty app.

## 2. App, routing and server-state cache (`shared/web-app`)

- [x] 2.1 Add `src/app/router.tsx` (routes `/` and `*`), `HomePage` and
  `NotFoundPage` per D4 and D10. Use only translated strings; the i18n wiring is
  task 3.1. Add Vitest tests through `createMemoryRouter`:
  - home heading and notice;
  - not-found message and link target;
  - following the link shows home.

  Verify the tests pass.
- [x] 2.2 Add `src/app/queryClient.ts` (`createQueryClient()` per D5) and `App.tsx`
  wiring `QueryClientProvider` and `RouterProvider`. Add an MSW test showing that two
  components using the same query key cause exactly one request, and a unit test for
  the retry rule (no retry on 4xx `ApiError`). Verify the tests pass.

## 3. i18n (`shared/i18n`)

- [x] 3.1 Add `src/i18n/locales/en.json` and `uk.json` with the keys from the
  design table (en and uk translations for every string), and `src/i18n/index.ts`
  per D6. Add tests:
  - home page in `uk`;
  - a `uk`-missing key falls back to `en`.

  Verify the tests pass.
- [x] 3.2 Add `src/i18n/language.ts` (detect, save, `<html lang>` sync). Add unit
  tests for each "initial language" scenario (saved `uk`, `uk-UA` browser, `de-DE`
  browser, unsupported saved `fr`), the language-change scenario, the start-up
  `lang` scenario, and the case where localStorage throws. Verify the tests pass.
- [x] 3.3 Add `frontend/scripts/check-i18n.mjs`: an exported pure function plus a
  CLI that exits 1 and names each missing key and the file it is missing from.
  Add Vitest tests for these fixtures:
  - matching keys;
  - `home.title` missing in `uk`;
  - an empty `uk` value.

  Verify that `pnpm --filter @divenet/frontend i18n:check` passes on the real files.
- [x] 3.4 Enable `i18next/no-literal-string` (`jsx-text-only`) for `src/**/*.tsx`,
  excluding tests. Add a test that runs ESLint's Node API on an in-memory component:
  `<p>Hello</p>` is reported with its line, and `{t("home.title")}` is not. Verify
  `lint` passes on the app.

## 4. API types and client (`shared/api-contract`, `shared/api-client`)

- [x] 4.1 Add `frontend/scripts/check-api-types.mjs` (check mode and `--write`,
  per D7) and generate `src/api/schema.gen.ts`. Exclude the generated file from
  ESLint and Prettier. Add Vitest tests in a temp directory:
  - current types pass;
  - stale types fail with the regenerate command in the message;
  - a check run leaves the file unchanged;
  - `--write` followed by a check passes.

  Verify that `api:types:check` passes on the repository.
- [x] 4.2 Add `src/api/ApiError.ts` and `src/api/client.ts` per D8 (absolute
  same-origin `/api/v1` base, middleware that throws `ApiError`). Add MSW tests
  with a test-only `paths` type:
  - request URL is `<origin>/api/v1/sites`;
  - a 400 problem document exposes status, title, detail and field errors;
  - a 502 with a non-JSON body has a status and no problem;
  - a network failure gives `kind: "network"` and no status.

  Verify the tests pass.

## 5. Gate and documentation

- [x] 5.1 Add the front-end steps to `scripts/check.mjs` in the D2 order, before the
  back-end step, and update its header comment. Verify that `pnpm check` runs every
  step and passes. Then verify that each of these fails the gate at the expected step:
  - a deliberately removed `uk` key;
  - a hand-edited `schema.gen.ts`;
  - a literal JSX string.

  Revert each probe afterwards.
- [x] 5.2 Update the docs and verify that each documented command runs as written:
  - `AGENTS.md`: code map row for `frontend/`, the Checks list, fix commands
    (Prettier write, `api:types`), the prerequisites, and remove "Not covered: front-end".
  - `docs/ARCHITECTURE.md`: drop "(planned)" from `frontend/` in the repository layout.
  - `README.md`: running the front-end with `pnpm --filter @divenet/frontend dev`
    against `./mvnw spring-boot:test-run`.
- [x] 5.3 Update `docs/ROADMAP.md`:
  - reword the `bootstrap-frontend` row (no app shell or footer);
  - add the M0 row `add-app-shell` (layout, navigation, language switcher, safety
    disclaimer footer; depends on `bootstrap-frontend` and `docs/DESIGN.md`);
  - make `add-authentication` depend on `add-app-shell`.

  Verify with `openspec validate --all --strict`.

## 6. Final verification

- [x] 6.1 Run `pnpm check` from a clean install (`node_modules` and `frontend/dist`
  removed) and confirm that every step passes. Then update `docs/HANDOFF.yaml` with
  the result, and the roadmap status as part of archiving.

## Workflow follow-up

- Commit on `change/bootstrap-frontend`, push and open a PR to `master` when the user asks.
- Run `/opsx:archive bootstrap-frontend` once `pnpm check` passes, and set the
  roadmap status to archived in the same commit.
