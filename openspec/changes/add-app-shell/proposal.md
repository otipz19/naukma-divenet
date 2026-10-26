# Proposal

## Why

The front-end is a set of unstyled placeholder pages. Every feature from
`add-authentication` onward needs a common frame to plug into: the header with
navigation and the language switch, the footer with the safety disclaimer that
must appear on every page, the design tokens, fonts and base styles from
`docs/DESIGN.md`, and the light and dark themes. Building this once, now, means
features build to the design as they go instead of being restyled in M6.

Roadmap item: `add-app-shell` (M0). It covers no user story directly; it is the
frame for all of them, and it delivers the safety disclaimer from
[PRODUCT.md](../../../docs/PRODUCT.md) on every page.

## What Changes

- **App layout.** A layout route wraps every page in the header, a `main`
  landmark and the footer, following `design/system/components/AppHeader` and
  `AppFooter`. A "Skip to content" link moves focus past the header.
- **Header navigation.** A wordmark that links to `/` and a main navigation
  built from a list of entries that feature changes extend. This change adds one
  entry, Map (`/`). The active entry carries `aria-current="page"`. Below
  `bp-md` (768 px) the navigation and the language switch move into a drawer
  opened by a menu button.
- **Language switch.** EN/UK toggle buttons with `aria-pressed` in the header
  (and the drawer). They call `i18n.changeLanguage`, which already saves the
  choice and updates `<html lang>` (`shared/i18n`).
- **Footer.** The navy band with the safety disclaimer ("Safety:" then the
  sentence) and the meta line, from the locale files, never dismissible.
- **Base styles and tokens.** The app imports `design/system/tokens.css` from the
  repository (never a copy) and adds a global base stylesheet: page background,
  text colour, body type, focus ring, reduced motion. Components use CSS modules
  that reproduce the `dn-*` rules from `bundle.css`.
- **Fonts.** Manrope, Golos Text and JetBrains Mono, with Cyrillic, self-hosted
  through `@fontsource` packages. No request to Google Fonts.
- **Theme.** The app sets `data-theme="dark"` on `<html>` while the system
  prefers a dark colour scheme and `light` otherwise, and follows changes while
  the page is open. There is no manual toggle: the design specifies none.
- **Home page.** The placeholder home page now renders inside the shell, styled
  with tokens. `add-dive-site-catalog` replaces it with the map.
- **Checks.** Three new gate steps:
  - `node design/build-tokens.mjs --check`, so a stale `tokens.css` fails the gate.
  - A tokens-only check of front-end CSS: it fails on a literal colour, a px
    length other than a 1–2 px hairline, or a redefined token (DESIGN.md rule 1).
    Until now this rule was left to review, and this project has no required review.
  - A build-output check, run after the production build: it fails when the
    output lacks the token custom properties or the font files, or references a
    Google Fonts host.

Deferred:

- **Account area** (Log in / Sign up, avatar menu) and the admin-only
  Moderation link: `add-authentication`. The header leaves a slot for them.
- **Feed and Dive log navigation entries:** added by `add-feeds` and
  `add-dive-log`, which create those routes. Linking to pages that do not exist
  would show the not-found page in the demo.
- **Map page layout** without the footer (disclaimer strip in the side panel):
  `add-dive-site-catalog`.
- **A manual theme toggle:** not in the design. If wanted, it is a design change
  first.

## Capabilities

### New Capabilities

- `shared/app-shell`: the frame around every page: layout, header navigation,
  mobile drawer, language switch, footer with the safety disclaimer, theme
  following the system preference, and self-hosted fonts.
- `shared/design-tokens`: how the front-end consumes the design system: tokens
  imported from `design/`, the freshness check of `tokens.css` in the gate, and
  the tokens-only rule for front-end CSS.

### Modified Capabilities

- `shared/web-app`: the placeholder home page is no longer "unstyled"; it and the
  not-found page render inside the app shell.

## Impact

- **Front-end:** `src/app/` (layout route, router, theme), new
  `src/components/` (AppHeader, AppFooter, LanguageSwitch, NavDrawer),
  `src/styles/` (global base styles, font imports), `main.tsx`, `index.html`,
  locale files (`shell.*` keys in `en` and `uk`).
- **Dependencies:** `lucide-react`, `@fontsource/manrope`,
  `@fontsource/golos-text` and `@fontsource/jetbrains-mono` in
  `frontend/package.json`, which changes `pnpm-lock.yaml`.
- **Gate:** three new steps in `scripts/check.mjs`; two new scripts in
  `frontend/scripts/` with their tests.
- **Boundaries (AGENTS.md):** `scripts/check.mjs` and `pnpm-lock.yaml` need the
  user's approval to edit. Approving this proposal is asked to cover exactly
  these two edits.
- **No back-end, API, migration or OpenAPI change.**
- **No departure from `docs/ARCHITECTURE.md`**, so no new ADR. The change
  follows DESIGN.md rules 1–9 as written.
