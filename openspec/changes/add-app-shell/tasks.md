# Tasks

## 1. Dependencies and token checks (`shared/design-tokens`)

- [x] 1.1 Set `add-app-shell` to in-progress in `docs/ROADMAP.md`. Add these
  exact-pinned dependencies to `frontend/package.json`:
  - `lucide-react`;
  - `@fontsource/manrope`, `@fontsource/golos-text` and
    `@fontsource/jetbrains-mono`.

  Then run `pnpm install`. Verify that it succeeds and updates `pnpm-lock.yaml`;
  this edit is approved with the proposal.
- [x] 1.2 Add `frontend/scripts/check-css-tokens.mjs` (D6) and a `css:check`
  script, with `check-css-tokens.test.mjs` fixtures covering:
  - the tokens-only pass;
  - `color: #0b5bb0;` rejected with file and line;
  - `padding: 12px;` rejected;
  - `--accent: …` rejected;
  - `1px`/`2px` and px inside `@media` accepted;
  - a named colour rejected, and `transparent`/`currentColor` accepted.

  Verify that the tests pass and that `css:check` passes on the current `src/`.
- [x] 1.3 Add `frontend/scripts/build-tokens.test.mjs`. It covers the current
  tokens passing, and the stale tokens: a temp copy with a changed value fails
  with exit 1, the message names `node design/build-tokens.mjs`, and the copied
  `tokens.css` is unchanged. Verify that the tests pass.
- [x] 1.4 Add the gate steps `design: tokens.css matches tokens.json` and
  `frontend: tokens-only CSS` to `scripts/check.mjs`, at the positions in D6
  (approved with the proposal). Run two negative probes and record them in
  HANDOFF:
  - hand-edit `design/system/tokens.css`: the gate fails at the tokens step;
  - add `#fff` to a CSS file: the gate fails at the tokens-only step.

  Revert both.

## 2. Base styles, fonts and theme (`shared/app-shell`, `shared/design-tokens`)

- [x] 2.1 Add `src/styles/fonts.ts` (the weights from D4) and
  `src/styles/global.css` (D4). Import fonts, `../../design/system/tokens.css`
  and `global.css` in `main.tsx`. Verify that `css:check` passes and that
  `build` succeeds.
- [x] 2.2 Add `frontend/scripts/check-build-output.mjs` (D6) and a `build:check`
  script, with fixture tests (temp `dist` directories) covering:
  - a pass;
  - a missing token property;
  - a missing Cyrillic font file per family;
  - a `fonts.googleapis.com` reference.

  Add the `frontend: build output` gate step after `production build`. Verify
  that the tests pass and that `build` then `build:check` passes on the real
  build.
- [x] 2.3 Add `src/app/theme.ts` (`watchSystemTheme`, D5). Add the default
  `matchMedia` stub to `src/test/setup.ts`, call the function from `main.tsx`,
  and add `<meta name="color-scheme">` to `index.html`. Add unit tests for the
  light system, the dark system and a preference change while open. Verify that
  the tests pass.

## 3. Layout, header and footer (`shared/app-shell`, `shared/web-app`)

- [x] 3.1 Add `en` and `uk` translations for every `shell.*` key in D7, and
  update `home.placeholder` in both locales. Verify that `i18n:check` passes.
- [x] 3.2 Add `src/app/navigation.ts` (D2) and `src/app/AppLayout.tsx` (D1).
  Turn `routes` into the layout route with `/` (index) and `*` as its children,
  and remove `<main>` from HomePage and NotFoundPage. Update the existing
  `router.test.tsx` home-page test to the modified `shared/web-app` scenario
  (the heading inside the main landmark). Add tests for:
  - the landmarks on `/` and on `/no-such-page`;
  - the skip link: the first Tab focuses it, and activating it focuses main.

  Verify that all router tests pass.
- [x] 3.3 Add `src/components/AppFooter/` (component and CSS module from
  `dn-footer*`). Add tests for:
  - the English disclaimer and the map-data text, with no button in the footer;
  - the Ukrainian disclaimer and meta line;
  - the disclaimer on `/no-such-page`.

  Verify that the tests and `css:check` pass.
- [x] 3.4 Add `src/components/LanguageSwitch/` (labelled group, `aria-pressed`,
  `changeLanguage`). Add tests: with `en` active, EN is pressed and UK is not;
  pressing UK switches the header and footer to `uk` text, sets UK pressed,
  saves `uk` and sets `<html lang="uk">`. Verify that the tests pass.
- [x] 3.5 Add `src/components/AppHeader/` (wordmark, `NavLink` list from
  `navItems`, LanguageSwitch, menu button; CSS module from `dn-header*`,
  `focus-inverse` focus ring). Add tests for:
  - the wordmark link to `/`;
  - the labelled navigation with Map → `/`, in `en` and `uk`;
  - Map has `aria-current="page"` on `/`;
  - no entry is current on `/no-such-page`.

  Verify that the tests and `css:check` pass.
- [x] 3.6 Add `src/components/NavDrawer/` (D3: dialog, scrim, focus handling,
  closing). Add tests:
  - the menu button opens the dialog (`aria-expanded="true"`, the navigation and
    the language switch inside it);
  - Escape closes it and returns focus to the menu button
    (`aria-expanded="false"`);
  - following Map inside it closes it and shows `/`.

  Verify that the tests and `css:check` pass.

## 4. Integration check

- [x] 4.1 Run the dev server and take screenshots of `/` and `/no-such-page` at
  1280 px and at 375 px (drawer open). Take them in light and in dark (emulated
  `prefers-color-scheme`), and in `en` and in `uk`. Compare each with
  `design/system/components/AppHeader/preview.html`, `AppFooter/preview.html`
  and `design/screens/MobileSite.html` (dark, `uk`). Fix any gap, and note any
  remaining deviation in design.md.
- [x] 4.2 Run `pnpm check` from the repository root and verify that every step
  passes, including the three new ones. Update the `docs/ARCHITECTURE.md`
  front-end layout block (`src/components/`, `src/styles/`) and the AGENTS.md
  Checks list (the three new steps). Then set the roadmap status and update
  `docs/HANDOFF.yaml`.

## Workflow follow-up

- Open a PR from `change/add-app-shell` to `master` once the user asks, and wait
  for the green `check` job.
- After the merge, run `/opsx:archive` and set the roadmap status to `archived`
  in the same commit.
