# Design

## Context

The map page is `/`, built in `features/site/MapPage.tsx`. It sits in `app/AppLayout.tsx`,
which renders, in order: a skip link, `AppHeader`, `main`, `AppFooter` and the toast region.

Current layout:

- **Desktop:** `.layout` is a two-column grid at `height: 90vh`. The side panel scrolls as one
  piece and holds, in order, the "Submit a site" link, the search box, the full
  `SearchFilters`, the count and the list.
- **Below 1100 px:** the side panel becomes `display: contents`. The controls sit above a
  `70vh` map, and the results lie over the lower 60 % of the map.
- **Footer:** `AppFooter` is added below every page, the map page included. The map page
  cancels the footer's top margin with a negative margin.

Findings F-03 and F-10 to F-12 record what the owner decided. The shared `Dialog`
(`components/Dialog`, spec `shared/dialogs`) and its jsdom shim come from
`add-dialogs-and-toasts`.

## Goals / Non-Goals

**Goals:**

- No footer, and a first-visit disclaimer dialog.
- A map page that never scrolls at any width.
- On a desktop, collapsed filters with chips and a count that stays in view.
- "Add a site" on the map.
- A phone layout that matches `MobileMap.html`.

**Non-Goals:**

- Dragging the results sheet.
- Starting the submit-site picker at the current map centre.
- A theme switch.
- Any back-end change.
- Changing how filters map to the URL or to the markers request: `siteSearch.ts` keeps its
  contract.

## Decisions

### D1. The disclaimer dialog lives in the shell

`app/AppLayout.tsx` renders a `DisclaimerDialog`:

- It lives in `features/disclaimer/`, since it is a product notice and not a generic
  component.
- It is rendered after `main`, in place of `AppFooter`.
- On mount, `readDismissed()` reads `localStorage["divenet.disclaimer"] === "dismissed"`
  inside a `try`, the way `i18n/language.ts` does it. When the value is missing, the dialog
  opens.
- Whether it is open is component state set once on mount, so a route change never opens it
  again, because `AppLayout` stays mounted.

The dialog is built on `Dialog` (`size="sm"`, close button on):

- **Title:** `shell.disclaimer.title` ("Before you dive").
- **Body:** the bold lead and the sentence, then the project line in `caption` style, then
  the "Don't show again" checkbox.
- **Actions:** one primary "Got it" button.

Every way of closing it calls one `close()`. `close()` saves `dismissed` if the box is
checked, then unmounts the dialog. This covers Escape, the close button and "Got it".

Because the dialog opens on load, the element focused when it opened is `body`. When it
closes, `close()` moves focus to `main`, which has `tabIndex={-1}`, so keyboard users land
at the page content.

Rejected alternatives:

- **Opening it from each page:** every page would have to remember to do it.
- **`sessionStorage` for the unchecked case:** the owner asked for "first visit" plus
  "Don't show again". Showing it again on each page load until the box is checked matches
  that, and it is simpler.

### D2. The shell becomes a fixed-height column

The changes to the shell:

- `.layout` changes from `min-height: 100vh` to `min-height: 100dvh`, with `main` as
  `flex: 1; min-height: 0; display: flex; flex-direction: column`.
- The map page's root takes `flex: 1; min-height: 0`, and the map page sets
  `height: calc(100dvh - var(--header-height))` on its layout. `--header-height` already
  exists and sizes `AppHeader`.
- Other pages keep scrolling the document as they do now.
- The negative-margin hack in `MapPage.module.css` goes, together with the footer it
  worked around.

### D3. One component tree, the layout switched by a media query hook

The phone and desktop layouts differ in structure, not only in style. On a phone the filters
go in a `Dialog`; on a desktop they are inline. CSS alone cannot move them.

- A small `useMediaQuery("(max-width: 1099px)")` hook in `features/site/` reads
  `window.matchMedia` and listens for changes.
- The jsdom default in `test/setup.ts` matches no query, so unit tests get the desktop
  layout by default. Phone tests install a matching `matchMedia`, the way `theme.test.ts`
  does.
- The breakpoint stays at 1100 px (`bp-lg`, DESIGN.md rule 9). The CSS uses the same value,
  so the two cannot disagree.

### D4. The desktop side panel: a fixed head over a scrolling body

`.side` becomes a two-row grid, `grid-template-rows: auto minmax(0, 1fr)`:

- **Head** (`section`, "Search and filters"), always visible: the search box, then a row with
  the Filters toggle (`aria-expanded`, "Filters · N"), then the active-filter chips (D5),
  then the count `h2`.
- **Body** (`overflow-y: auto`): `SearchFilters` when it is expanded (collapsed by default),
  then the results list or the empty and error messages.

The filters stay inline in the body, not in a popover. This keeps "Clear all" and every
control in the reading order. When they are expanded, the list is below them, but the count
in the head still tells the user how many sites match. The old "Show list" toggle and
`.closedOnNarrow` are removed.

### D5. Active filter chips

`activeFilterChips(search, names)` is a pure function in `siteSearch.ts`:

- It returns `{ key, label, without: SiteSearch }[]`, one entry per active value, in the
  order difficulty, gear, country, region, depths, rating.
- Each label is in the active language:
  - difficulty: the difficulty word;
  - gear: the gear item's name from the cached `gear-items` query;
  - country and region: the names from the `geo` bundle;
  - depths: "From 10 m" and "To 30 m";
  - rating: "4+ stars".

The UI renders each entry as a `button` styled as a chip, with a Lucide `x` and the
accessible name "Remove filter: Beginner" (`site.search.removeFilter`). It is not the
`Chip` toggle, because `aria-pressed` would claim the wrong meaning. Pressing it calls
`update(without)`.

The function is unit-tested on its own, and its count equals `activeFilters()`, so the
toggle's number and the chips cannot drift apart.

### D6. The phone layout

On a phone, `.layout` is one cell, and its children are stacked over the map with absolute
positioning inside a `position: relative` container that fills the height from D2:

- **Top bar:** the search box and the Filters button, floating with `shadow-2`, matching
  `MobileMap.html`.
- **Filters dialog:** pressing Filters opens `Dialog` titled "Filters" (`site.search.filters`).
  - The body is `SearchFilters` without its own heading and "Clear all", because the dialog
    has them.
  - Changes apply at once through the URL, as on a desktop, so the map and the count behind
    the dialog are already up to date.
  - The actions are "Clear all" (secondary) and "Show N sites" (primary), which closes the
    dialog. Focus returns to the Filters button through `Dialog`.
  - It never has unsaved changes, so it does not use `dirty`.
- **Results sheet:** a `section` at the bottom.
  - Its head row has the count `h2` and a toggle button ("Show all" or "Show less") with
    `aria-expanded`.
  - **Peek:** the head and the first card. The other cards are not rendered, so they do not
    add tab stops.
  - **Expanded:** `max-height: 70%` of the map area, with the list scrolling inside it.
  - The empty and error messages show in the peek state.
- **Leaflet controls:** the zoom control moves to `bottomright` on phones, above the sheet,
  so the top bar does not cover it. This uses the `position` prop on a
  `ZoomControl`, with the default control off.

Rejected: a drag gesture for the sheet. It needs pointer handling that cannot be reached from
the keyboard or tested in jsdom, and the mockup's handle is decoration. A button covers both
states.

### D7. "Add a site" on the map

- It is a `Link` to `/sites/new` styled `buttonClassName({ variant: "primary" })`, with a
  Lucide `plus` icon and the text `site.map.addSite` ("Add a site").
- It is positioned absolutely in the map section's top-right corner (`z-index` above Leaflet
  panes, which `isolation: isolate` on `.mapSection` already contains).
- On a phone the top bar covers the top of the map, so the link sits at the right edge just
  above the sheet's peek height.
- Only `MapPage` uses the old `site.submit.link` key, so it is removed.

### D8. E2E start with the disclaimer dismissed

`e2e/src/support/index.ts` gains a Playwright `test` fixture that extends `page` and
`context` with
`addInitScript(() => localStorage.setItem("divenet.disclaimer", "dismissed"))`.

- Journeys import `test` from support instead of from `@playwright/test`, so each one starts
  as a returning visitor.
- The audit specs that build their own `browser.newContext()` call the same helper,
  `dismissDisclaimer(context)`.
- One journey in `anonymous-browse.spec.ts`, using a plain context, checks the first-visit
  dialog. It opens `/`, sees the dialog, checks "Don't show again", presses "Got it",
  reloads, and sees no dialog. It also checks the page heights from `site/map` at 1440×900
  and 390×844.
- `audit-accessibility.spec.ts`:
  - scans `/` once with the dialog open in the light theme, the dark theme and `uk`;
  - on a 390×844 viewport, scans with the sheet expanded and with the filters dialog open.

Perf: Lighthouse runs on a fresh profile, so it measures the dialog a first visitor sees. The
budgets are re-run as they are. If one fails, the cause is investigated, and no budget is
loosened.

### D9. i18n

**`shell.footer.*` becomes `shell.disclaimer.*`:**

- `title` and `dontShowAgain` are new;
- `gotIt` is new;
- `safetyLead`, `disclaimer` and `project` keep their text;
- `mapData` is removed, because Leaflet's attribution uses `site.map.attribution`.

**New `site.*` keys:**

- `site.map.addSite`;
- `site.search.removeFilter` ("Remove filter: {{name}}");
- `site.search.chip.minDepth`, `.maxDepth` and `.minRating`;
- `site.search.showSites` ("Show {{n}} sites", with Ukrainian plural forms);
- `site.search.sheetExpand` and `.sheetCollapse`.

**Removed:** `site.search.showList`, `site.search.hideList` and `site.submit.link`.

There is no new namespace.

### D10. Design files

- **`design/screens/Map.html`:** the panel with a fixed head (collapsed filters, chips and
  count), "Add a site" on the map, and no disclaimer strip. A second frame shows the filters
  expanded.
- **`design/screens/MobileMap.html`:** keeps its frame, without the disclaimer caption. It
  gains a frame with the filters dialog and one with the sheet expanded.
- **A first-visit dialog frame** goes in `Map.html`.
- **`design/system/components/AppFooter/`** is deleted, and the footer styles are removed
  from `components/bundle.css`.
- **`docs/DESIGN.md`:** the component list, the screen table, rule 8 (now: a first-visit
  dialog that can be dismissed, plus the site page's box that cannot) and rule 9 (the map
  fills the viewport, with the phone layout described).

**REST endpoints, Flyway migrations:** none.

## Risks / Trade-offs

- **The dialog blocks every first-visit journey.** E2E and manual demos start with a modal.
  The D8 fixture handles the suites. For a demo this is the intended first impression.
- **`100dvh` on old mobile browsers.** Browsers without `dvh` ignore the declaration, so a
  `100vh` fallback is declared first. The worst case is a sheet partly under the browser bar,
  which still does not scroll the page.
- **A hook-driven layout flickers on resize across 1100 px.** The tree switches at once, and
  open state (filters expanded, sheet expanded) resets. This is acceptable, since nobody
  resizes across the breakpoint mid-task.
- **Lighthouse with the dialog open.** LCP may now be the dialog's text and not the map
  tiles. It is measured, not avoided (D8).
- **Removing the footer drops the always-visible disclaimer** on pages other than the site
  page. The owner decided this (F-03). The site page, where a diver judges a site, keeps the
  box that cannot be dismissed.

## Migration Plan

This is front-end only and needs no data migration. A visitor's first load after the deploy
shows the dialog once, until they check "Don't show again".
