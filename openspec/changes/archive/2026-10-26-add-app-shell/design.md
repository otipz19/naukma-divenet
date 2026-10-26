# Design

## Context

- What exists today (`bootstrap-frontend`):
  - `src/app/router.tsx` exports a flat `routes` array (`/`, `*`) that
    `createBrowserRouter` uses. `src/test/render.tsx` renders those same routes
    in a memory router, with fresh i18n and query-client instances.
  - `src/i18n/index.ts` creates the i18next instance. Its `languageChanged`
    handler already saves the choice and sets `<html lang>`, so the switch only
    has to call `changeLanguage`.
  - The ESLint rule `i18next/no-literal-string` (jsx-text-only) bans literal JSX
    text in `src/**/*.tsx`.
  - No CSS exists. `tsconfig.app.json` includes the `vite/client` types, so
    `*.module.css` imports are already typed.
- `design/system/tokens.css` defines the colour and shadow tokens under `:root,
  [data-theme="light"]` and `[data-theme="dark"]`, plus spacing, radius, layout and
  font-stack properties and the type classes (`.h1`, `.body`, `.label`, …).
  `design/build-tokens.mjs --check` already exists, but nothing runs it.
- `design/system/components/bundle.css` holds the `dn-header*`, `dn-footer*`
  and `dn-btn*` reference rules. They use literal font shorthands (for example
  `800 20px/28px`) that the type classes do not cover.
- See proposal.md for scope; the specs are in `specs/shared/app-shell`,
  `specs/shared/design-tokens` and `specs/shared/web-app`.

## Goals / Non-Goals

**Goals:**
- Feature changes add a page and, where needed, a navigation entry, and get the
  frame for free. They never touch the layout to do so.
- Every visual value in front-end CSS can be traced to a token, and the gate
  enforces it.

**Non-Goals:**
- The shared component library (Button, TextField, Chip, Badge, …). Each is built
  by the first feature that needs it. This change builds only what the shell uses.
- Error boundaries and loading states (`polish-release`).
- Document titles per page.

## Decisions

### D1. A layout route wraps all routes
`routes` becomes a single layout route whose `element` is `<AppLayout />`
(`src/app/AppLayout.tsx`) and whose `children` are the existing `/` (index)
and `*` routes. `AppLayout` renders the skip link, `<AppHeader />`,
`<main id="main" tabIndex={-1}>` with `<Outlet />`, and `<AppFooter />`.

- Pages stop rendering their own `<main>`: HomePage and NotFoundPage return a
  fragment or a `div`, so there is exactly one `main` landmark.
- `renderRoute` in `src/test/render.tsx` keeps working unchanged, because it
  uses the exported `routes`.
- Later, `add-dive-site-catalog` needs the map without the footer. It can add a
  `layout` handle on the route, or a second layout route. That is its decision;
  nothing here prevents it.
- *Alternative:* wrap `<RouterProvider>` in the layout inside `App.tsx`.
  Rejected: the layout needs router hooks (`useLocation`, `NavLink`) and must
  render inside the router.

### D2. Navigation entries are a typed list
`src/app/navigation.ts` exports
`navItems: { to: string; labelKey: ParseKeys; end?: boolean }[]`, with Map
(`/`, `end: true`) as its only entry. Feature changes append to it, as they do
with `routes`.

- The header and the drawer both render the list with React Router's `NavLink`,
  which sets `aria-current="page"` on the match. With `end: true`, `/` matches
  only `/` and not every path.
- Role-gated entries (Moderation) need a `requires` field. `add-authentication`
  adds it, since it is the change that knows about roles.

### D3. Components and CSS modules
New shared components go in `src/components/<Name>/<Name>.tsx` with
`<Name>.module.css`:

- `AppHeader`;
- `AppFooter`;
- `LanguageSwitch`;
- `NavDrawer`.

Each module reproduces the matching `dn-*` rules from `bundle.css`, with
these substitutions:

- **Type.** Literal font shorthands become the type classes, applied in JSX next
  to the module class (`className={`label ${styles.link}`}`). The wordmark's
  `800 20px/28px` matches no type class. It uses the `.h3` class (18/26, the
  closest documented style) with `font-weight: 800` and the mockup's
  `letter-spacing`, a 2 px deviation recorded under Risks. The alternative,
  adding a `wordmark` type style to `tokens.json`, is a design change and out of
  scope here.
- **Font sizes in px.** `12px/16px` becomes the `.caption` class (it also adds
  `letter-spacing: 0.2px`, an accepted deviation). `14px/20px` becomes `.label`
  or `.body-sm`.
- **Drawer and avatar sizes.** Use spacing tokens.

The drawer:

- It is a `role="dialog"` with `aria-modal="true"`, labelled by the translated
  menu name. It slides from the left over a `var(--scrim)` backdrop in 200 ms
  (`prefers-reduced-motion` removes the transition).
- Opening moves focus to its close button. Escape, the close button, the
  backdrop and following a link inside it all close it, and focus returns to the
  menu button.
- Focus is kept inside the drawer with a small keydown handler on Tab. A native
  `<dialog>` with `showModal()` was considered, but jsdom does not implement
  `showModal`, so the spec's drawer scenarios could not be tested.
- Responsive rules:
  - The menu button and the drawer exist only below 768 px. The CSS uses
    `@media (max-width: 767px)` and `(min-width: 768px)`, because custom
    properties cannot be used in media queries.
  - Above 768 px the drawer is not rendered at all: the component reads
    `matchMedia("(min-width: 768px)")` and closes itself when the query starts
    to match.

Icons come from `lucide-react` (`Menu`, `X`) at 20 px with `aria-hidden`. The
buttons carry the translated `aria-label`.

### D4. Global styles and fonts
`src/styles/global.css` is imported once from `main.tsx`, after the fonts and
`tokens.css`:

```ts
import "./styles/fonts";                          // @fontsource weight files
import "../../design/system/tokens.css";          // the design file itself
import "./styles/global.css";
```

`global.css` holds only element-level base rules:

- `box-sizing`, and `margin: 0` on `body`;
- `body` uses `--surface-0` for the background, `--ink` for text and the `.body`
  type values through the token variables;
- `:focus-visible` gets a 2 px solid `var(--focus)` outline with a 2 px offset;
- the skip link's visually-hidden-until-focused style;
- a `prefers-reduced-motion` block that removes transitions.

`src/styles/fonts.ts` imports exactly the weights the type scale and `bundle.css`
use:

- Manrope 600, 700 and 800;
- Golos Text 400, 500 and 600;
- JetBrains Mono 500.

The `@fontsource/<family>/<weight>.css` files declare every subset, Cyrillic
included, with `unicode-range`, so a browser downloads only the subsets a page
needs. The family names they register (`Manrope`, `Golos Text`,
`JetBrains Mono`) match the stacks in `tokens.css`.

- *Alternative:* the `@fontsource-variable/*` packages. Rejected: they register
  `"Manrope Variable"` and so on, which would require changing the token stacks.

Vite resolves `../../design/system/tokens.css`, because its default
`server.fs.allow` is the workspace root, which `pnpm-workspace.yaml` marks as
the repository root. The build inlines it into the CSS bundle.

### D5. Theme follows `prefers-color-scheme`
`src/app/theme.ts` exports `watchSystemTheme(media = matchMedia("(prefers-color-scheme: dark)"))`.

- It sets `document.documentElement.dataset.theme` to `dark` or `light` and
  subscribes to the query's `change` event.
- It returns an unsubscribe function for tests.
- `main.tsx` calls it before `createRoot`.
- `index.html` adds `<meta name="color-scheme" content="light dark">`, so form
  controls and scrollbars match the theme.

The tests pass a fake `MediaQueryList`, because jsdom has no `matchMedia`; the
test setup adds a default stub that reports `matches: false`.

There is no manual toggle and no saved preference: DESIGN.md rule 3 and the
AppHeader spec define none. This is how the roadmap's "theme switch" is read.

### D6. Gate steps
Three steps are added to `scripts/check.mjs`. Each script follows the pattern of
`check-i18n.mjs`: a pure, exported function and a CLI wrapper, with a
`*.test.mjs` next to it that runs in the existing Vitest step.

| Position | Step name | Command |
| --- | --- | --- |
| after the openspec step | `design: tokens.css matches tokens.json` | `node design/build-tokens.mjs --check` |
| after `i18n key parity` | `frontend: tokens-only CSS` | `pnpm --filter @divenet/frontend run css:check` → `node scripts/check-css-tokens.mjs` |
| after `production build` | `frontend: build output` | `pnpm --filter @divenet/frontend run build:check` → `node scripts/check-build-output.mjs` |

`check-css-tokens.mjs` scans `src/**/*.css` and reports `file:line: message`
for each problem it finds:

- **Literal colours:** `#hex`, `rgb(`/`rgba(`/`hsl(`/`hsla(`, and CSS named
  colours. It uses a fixed list of the 148 CSS colour names, excluding
  `transparent` and `currentColor`.
- **px lengths other than `1px` and `2px`.** Lines inside an `@media` prelude are
  skipped.
- **Token redefinitions.** A token is any custom property name declared in
  `design/system/tokens.css`. Local custom properties with other names stay
  allowed.

Comments are stripped before scanning. The script needs no CSS parser: the
front-end CSS is hand-written and small, and the fixture tests cover the
patterns above.

`check-build-output.mjs` reads `frontend/dist/` and fails when:

- no `.css` file defines `--accent:` and `--space-4:`;
- there is no `.woff2` file whose name starts with `manrope-cyrillic`,
  `golos-text-cyrillic` or `jetbrains-mono-cyrillic`;
- any file contains `fonts.googleapis.com` or `fonts.gstatic.com`.

The stale-tokens scenario is tested in `frontend/scripts/build-tokens.test.mjs`:

- it copies `design/build-tokens.mjs` and `design/system/tokens.{json,css}` to a
  temporary directory;
- it changes one value in the copied `tokens.json`;
- it runs the copied script with `--check`;
- it then asserts that the exit code is 1, that the message names
  `node design/build-tokens.mjs`, and that the copied `tokens.css` is unchanged.

The script resolves its files relative to its own location, so the copy works.

### D7. i18n keys
The app keeps the single `translation` namespace. These keys are new, in `en` and
`uk`:

| Key | en |
| --- | --- |
| `shell.skipToContent` | Skip to content |
| `shell.nav.label` | Main |
| `shell.nav.map` | Map |
| `shell.menu.open` | Open menu |
| `shell.menu.close` | Close menu |
| `shell.menu.label` | Menu |
| `shell.language.label` | Language |
| `shell.footer.safetyLead` | Safety: |
| `shell.footer.disclaimer` | Information on DiveNet is for reference only and does not replace dive planning according to your agency's standards. |
| `shell.footer.project` | DiveNet · NaUKMA course project |
| `shell.footer.mapData` | Map data © OpenStreetMap contributors |

- `home.placeholder` changes to "The dive-site map is coming soon.", because the
  interface is no longer "being designed".
- The "EN" and "UK" button labels are rendered from the language code
  (`{code.toUpperCase()}`). They are the same in both locales and are not prose,
  so they are not locale keys. The jsx-text-only lint rule allows expressions.

### D8. Not in this change: REST endpoints and migrations
There are no new or changed REST endpoints and no Flyway migrations.
`api/openapi.json` and `schema.gen.ts` are untouched.

## Risks / Trade-offs

- **Theme flash.** On a dark system, the page can paint once in the light theme
  before `main.tsx` runs. → Accepted for now. The fix is a three-line inline
  script in `index.html`. It is left out because it adds the only inline script,
  and a future CSP would have to allow it. `polish-release` can revisit this.
- **The regex CSS check is not a parser.** A px value inside a string or URL
  could be a false positive. → The fixtures cover the patterns the code uses. A
  false positive fails loudly and is fixed by improving the script, never by
  weakening the rule.
- **Font weight drift.** A later component may need a weight that `fonts.ts`
  does not import, and the browser would then synthesize it. → `fonts.ts` lists
  the weights next to the type styles that need them. Adding a weight is a
  one-line change.
- **Wordmark size deviation (D3).** It differs from the mockup by about 2 px. →
  Recorded here. A `wordmark` type token can be added through a design PR later.
- **Gate time.** The three steps are plain Node scripts and take under a second
  each.

## Implementation notes

Recorded after the screenshot comparison (task 4.1) with `AppHeader/preview.html`,
`AppFooter/preview.html` and `screens/MobileSite.html`:

- **Sub-pixel values in `em`.** The tokens-only check bans px other than 1–2 px, so the
  wordmark's `letter-spacing: -0.3px` became `-0.015em` and the link
  `text-underline-offset: 3px` became `0.2em`. Both render within a fraction of a pixel.
- **Drawer colours.** The design does not specify the drawer surface. It uses `--brand`
  and `--on-brand`, like the header, so the navigation and switch styles are shared.
- **Language switch on phones.** `MobileSite.html` shows the switch in the footer; the
  spec and the AppHeader spec put it in the drawer, which is what is built.
- **Navigation entries** are rendered by a small `NavLinks` component next to
  `AppHeader`, shared by the header and the drawer.
- **Lint-rule test timeout.** `scripts/no-literal-string.test.mjs` runs a type-aware lint,
  whose first run builds a program over all of `src/`. With the shell's files it passed
  5 s under parallel test load, so that file's timeout is 30 s. The assertions are unchanged.

## Migration Plan

There is no data or deployment migration. Rollback is reverting the PR. The new
gate steps go with it.
