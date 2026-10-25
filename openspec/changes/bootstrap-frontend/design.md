# Design

## Context

- What exists today:
  - `pnpm-workspace.yaml` already lists `frontend`, but the folder does not exist.
  - The root `package.json` holds only the gate script and the OpenSpec CLI.
  - `scripts/check.mjs` runs `openspec validate` and then `backend/mvnw verify`.
    It already uses `shell: true`, so pnpm `.cmd` shims resolve on Windows.
  - CI installs Node 24, pnpm and Temurin 25, then runs `pnpm install --frozen-lockfile`
    and `pnpm check`.
- `api/openapi.json` has no paths yet, so the generated types cover no endpoints.
  The client and its tests have to work with an empty `paths` type.
- The library choices are fixed by ADR-0005 and the rules by `docs/ARCHITECTURE.md`
  (Front-end). This design records only the decisions local to this change.
- See proposal.md for why the change builds no UI.

## Goals / Non-Goals

**Goals:**
- A `frontend/` package that later feature changes only add to.
- No restructuring of `frontend/` in later changes.
- Every front-end check runs from `pnpm check`, is check-only and needs no Docker.

**Non-Goals:**
- CSS, a design system, layout components or a component library.
- Not even CSS modules yet: the placeholder pages are plain semantic HTML.
- Lazy-loaded locales, code splitting or a PWA.
- The front-end Dockerfile or nginx configuration (`add-local-stack`).

## Decisions

### D1. Package layout and scripts
`frontend/package.json` declares `"name": "@divenet/frontend"`, is private and
sets `engines.node >=24`. Source layout:

```
frontend/
  index.html                 static <html lang="en">, <title>DiveNet</title>
  vite.config.ts             React plugin, dev proxy
  vitest.config.ts           jsdom, setup file
  eslint.config.js, .prettierrc.json, .prettierignore
  tsconfig.json (+ tsconfig.app.json, tsconfig.node.json)
  scripts/check-i18n.mjs     locale parity (exports a pure function + CLI)
  scripts/check-api-types.mjs  generated-types freshness (pure function + CLI)
  src/main.tsx               mounts <App/>
  src/app/                   App.tsx, router.tsx, queryClient.ts
  src/app/routes/            HomePage.tsx, NotFoundPage.tsx (placeholders)
  src/i18n/                  index.ts (init), language.ts (detect/save), locales/{en,uk}.json
  src/api/                   schema.gen.ts (generated), client.ts, ApiError.ts
  src/test/                  setup.ts, msw server
```

`src/features/` and `src/components/` are created by the first change that needs them.

Scripts:

| Script | Command |
| --- | --- |
| `dev` | `vite` |
| `build` | `vite build` |
| `typecheck` | `tsc -b` |
| `lint` | `eslint . --max-warnings 0` |
| `format:check` | `prettier --check .` |
| `test` | `vitest run` |
| `i18n:check` | `node scripts/check-i18n.mjs` |
| `api:types` | `node scripts/check-api-types.mjs --write` (see D7) |
| `api:types:check` | `node scripts/check-api-types.mjs` |

There is no `format` fix script in the gate. The fix commands are `pnpm --filter
@divenet/frontend exec prettier --write .` and `pnpm --filter @divenet/frontend api:types`.
Both are documented in AGENTS.md.

### D2. Gate steps
`scripts/check.mjs` gains one step per front-end script. Each step runs as
`pnpm --filter @divenet/frontend run <script>`, so a failure is named precisely.
The order, after `openspec validate`:
1. i18n parity
2. API types freshness
3. typecheck
4. lint
5. format check
6. tests
7. build

The back-end step moves to the end, so the fast Node-only steps fail before the
Docker-backed one starts.
Considered: one aggregate `pnpm --filter … check` script. Rejected, because the gate
would then report only "frontend failed".

### D3. Versions
Every dependency is pinned exactly, checked against the npm registry on 2026-10-25:
- React 19.3, React Router 8.5 and Vite 8.3 with `@vitejs/plugin-react` 6.
- TanStack Query 5.104, i18next 26 and react-i18next 17. i18next is pinned to
  26.5.10 and react-i18next to 17.1.8, one patch below latest. The newest
  releases were younger than pnpm's minimum release age, and installing them
  would have added an exclusion to `pnpm-workspace.yaml`.
- Vitest 5, jsdom 30, Testing Library and MSW 3.
- ESLint 10 with `typescript-eslint` 8.72, `eslint-plugin-react-hooks`,
  `eslint-plugin-i18next` and `eslint-config-prettier`. Prettier 3.9.
- `openapi-typescript` 7.13 and `openapi-fetch` 0.17.

**TypeScript is pinned to 6.0.x, not 7.0:**
- `typescript-eslint` declares `typescript >=4.8.4 <6.1.0`, and type-aware linting
  depends on it.
- Upgrade to TS 7 once `typescript-eslint` supports it. That upgrade is a separate small change.

### D4. Routing
React Router in data mode (`createBrowserRouter` + `RouterProvider`), not framework
mode: the app is a static SPA with no SSR or file-based routes.
- Routes: `/` → `HomePage`, `*` → `NotFoundPage`.
- Tests render the same route objects with `createMemoryRouter`.
- Later changes add their routes from their feature folder to `router.tsx`.

### D5. Server-state cache
`createQueryClient()` returns a `QueryClient` with these defaults:
- `staleTime` of 30 s.
- `refetchOnWindowFocus: false`.
- `retry`: no retry for an `ApiError` with a 4xx status, and up to 2 retries otherwise.

`App` creates the client once. Tests create a fresh one per test, which keeps
tests isolated and lets them assert the request count (`shared/web-app`).

### D6. i18n
- **Setup:** one i18next namespace, `translation`, with keys grouped by a feature
  prefix (`app.*`, `home.*`, `notFound.*`). Later features add their own prefix in the
  same two files, so there is no namespace-per-feature split.
  - Locales are bundled statically. Two small JSON files do not justify lazy loading.
  - `fallbackLng: "en"`, `supportedLngs: ["en", "uk"]`.
  - `returnEmptyString: false`, so an empty value falls back to English at runtime.
    The parity check still flags an empty value.
- **Language detection:** a small module (`language.ts`) instead of
  `i18next-browser-languagedetector`:
  - Order: saved choice, then `navigator.languages[0]`, then `en`.
  - The saved choice is stored under the localStorage key `divenet.lang`.
  - The spec rules are narrow: only a Ukrainian browser maps to `uk`, and an
    unsupported saved value is ignored. Owning about 20 lines is clearer than
    configuring the plugin to match them.
  - localStorage access is wrapped in try/catch, so private browsing never breaks start-up.
- **Saving and `lang`:** a `languageChanged` listener saves the choice and sets
  `document.documentElement.lang`. It also runs once at init.
- **Parity check:** `check-i18n.mjs` flattens both files to dotted keys, treats
  `""` as missing, and prints one line per missing key with the file it is missing
  from. A Vitest test drives the exported function with fixture objects.
- **Hard-coded strings:** `eslint-plugin-i18next`'s `no-literal-string` in
  `jsx-text-only` mode applies to `src/**/*.tsx`. Test files are excluded.
  - It checks JSX text, not every string literal, so route paths and query keys stay legal.
  - The negative scenario is covered by a test that runs ESLint's Node API on a
    probe component. Type-aware linting only sees files on disk, so the test writes
    the probe to `src/__lint-probe__/` and deletes it afterwards.

### D7. Generated types and freshness
- `openapi-typescript` writes `src/api/schema.gen.ts`. The file is excluded from
  ESLint and Prettier and is never edited by hand.
- `check-api-types.mjs` calls the `openapi-typescript` Node API (`openapiTS` +
  `astToString`) on `../api/openapi.json`. It compares the result with the committed
  file after normalising line endings, and exits 1 with the regenerate command if
  they differ. It never writes the file.
- To keep CLI and API output identical, the CLI script calls the same module in
  write mode instead of the bare `openapi-typescript` binary. The `api:types`
  command becomes `node scripts/check-api-types.mjs --write`.
- A Vitest test covers current, stale and "file untouched" using a temp directory.

### D8. API client and errors
- `client.ts` exports `api = createClient<paths>({ baseUrl })`, where `baseUrl`
  is `new URL("/api/v1", window.location.origin)`.
  - An absolute URL is needed because undici's `Request` (used under Vitest)
    rejects relative URLs.
  - It is still the serving origin, so the dev proxy and nginx both work unchanged.
- An `openapi-fetch` middleware throws `ApiError` from `onResponse` for any non-2xx
  response, and from `onError` for network failures. Callers, including TanStack
  Query, therefore always see a thrown `ApiError` and never `{ error }` objects.
- `ApiError` (extends `Error`) has these fields:
  - `kind`: `"http"` or `"network"`.
  - `status?`.
  - `problem?`: `title`, `detail`, `instance`, and `errors` of `{ field, message }`,
    matching the back-end's `FieldViolation`.
  - The body is parsed only when the content type is JSON or `problem+json`. A
    body that fails to parse yields no `problem`.
- Tests use MSW and a test-only `paths` type, because the real `paths` is empty.

### D9. Dev proxy
- `vite.config.ts` proxies `/api` to `process.env.DIVENET_API_URL ?? "http://localhost:8080"`.
  `/v3/api-docs` and `/swagger-ui` are reached on the back-end port directly.
- `/media` is added by `add-media-uploads`.
- The proxy is not covered by a spec scenario. It is a developer convenience, and
  `add-local-stack` replaces it with nginx for the real stack.

### D10. Placeholder pages
- `HomePage` renders `<main><h1>{t("app.name")}</h1><p>{t("home.placeholder")}</p></main>`.
- `NotFoundPage` renders a message and a `<Link to="/">`.
- No stylesheet is imported. `add-app-shell` replaces both pages' surroundings.

## i18n keys added

| Key | en | uk |
| --- | --- | --- |
| `app.name` | DiveNet | DiveNet |
| `home.placeholder` | The DiveNet interface is being designed. | Інтерфейс DiveNet зараз розробляється. |
| `notFound.title` | Page not found | Сторінку не знайдено |
| `notFound.backHome` | Back to the home page | Повернутися на головну |

No REST endpoints, Flyway migrations or `api/openapi.json` changes.

## Risks / Trade-offs

- [`openapi-typescript` declares a peer of `typescript ^5.x` while we pin 6.0]
  → pnpm only warns. The freshness test exercises the generator, so a real
  incompatibility fails the gate rather than slipping through.
- [Front-end steps add install and run time to every gate run]
  → They are Node-only and run before the back-end step. Vitest and the Vite build
  on a near-empty app take seconds.
- [`jsx-text-only` lets literal strings through in props such as `aria-label` or `title`]
  → It is an accepted gap for now. Revisit when `add-app-shell` adds real
  components; the rule's `jsx-attributes` option can be enabled then.
- [The placeholder pages are throwaway code] → They are kept to two tiny
  components, so `add-app-shell` replaces them without touching the plumbing.

## Migration Plan

Additive only: no existing behaviour changes. To roll back, revert the PR. The
back-end and its checks are untouched.
