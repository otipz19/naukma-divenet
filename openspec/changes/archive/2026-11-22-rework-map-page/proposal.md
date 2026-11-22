# Proposal

## Why

In the product review (2026-11-21, `docs/review-findings`, F-03 and F-10 to F-12) the owner
found four problems with the map page:

- The footer makes the page scroll. On a narrow window it is about 376 px tall.
- On a desktop, the filters fill the side panel, so the result count and the first results
  are below the fold.
- "Submit a site" looks like part of the search form.
- On a phone, the page scrolls and the form covers the map, which is not what
  `MobileMap.html` shows.

All four change one screen and the shell around it. The owner decided the fixes, and the
shared Dialog this rework needs was delivered by `add-dialogs-and-toasts`.

## What Changes

- **App shell (F-03), BREAKING for the shell's contract:**
  - The footer is removed from every page, so the shell has two landmarks: banner and main.
  - The safety disclaimer opens in a first-visit dialog built on the shared Dialog. The
    dialog has the disclaimer, the "DiveNet · NaUKMA course project" line, a "Don't show
    again" checkbox and a close button.
  - Checking the box keeps the dialog closed on later visits in this browser
    (`localStorage`). If storage fails, the dialog shows again on the next visit.
  - The site page's own disclaimer box stays, and is now the only place where the
    disclaimer is always shown.
  - Leaflet's attribution control keeps the OpenStreetMap credit on every tiled map.
- **Full-height map:** the map page fills the viewport below the header (`100dvh` minus the
  header), and the page itself never scrolls. Only the side panel's list or the phone's
  results sheet scrolls.
- **Desktop panel (F-10):**
  - The Filters toggle is shown at every width. Filters are collapsed by default, and the
    toggle shows the active count ("Filters · 2").
  - Active filters show as removable chips under the search box.
  - The panel is split in two. A fixed head holds the search, the toggle, the chips and the
    count. The body below scrolls on its own and holds the open filters, then the results.
    The count and the first results are always in view.
- **Add a site (F-11):** a floating "Add a site" link sits in a corner of the map and opens
  `/sites/new`. It is no longer in the search panel.
- **Phone layout (F-12), below 1100 px, built to `MobileMap.html`:**
  - The map fills the screen below the header.
  - The search box and the Filters button float over the top of the map.
  - The filters open in a dialog with "Clear all" and "Show N sites".
  - The results are a bottom sheet over the map. Its peek state shows the count and one
    card, and it can be expanded to the full list.
- **Design:**
  - Update `design/screens/Map.html` and `MobileMap.html`.
  - Remove `design/system/components/AppFooter`.
  - Update `docs/DESIGN.md`: rule 8, the safety disclaimer, now says it is a first-visit
    dialog that can be dismissed, plus the site-page box that cannot. Rule 9 covers the
    responsive map.
- **Tests:**
  - E2E journeys start with the disclaimer already dismissed.
  - One journey checks the dialog itself.
  - The accessibility audit scans the open disclaimer dialog (both themes and `uk`) and
    the open phone filters dialog.

Stories: US-01 (world map), US-05 (search), US-06 (filters). The disclaimer is a PRODUCT.md
scope item, not a story.

Out of scope:
- The submit-site picker starting at the current map centre (F-11 lists it only as an
  option). `/sites/new` keeps its own default view.
- Dragging the phone results sheet. A button switches between peek and expanded, which can
  be reached from the keyboard and tested. A drag gesture is not built.
- The theme switch (F-8) and other shell polish stay in `polish-release`.
- No API, database or back-end change.

## Capabilities

### New Capabilities
- `shared/disclaimer`: the first-visit safety dialog. It covers when the dialog opens, what
  it shows, how it is dismissed, and how "Don't show again" is stored.

### Modified Capabilities
- `shared/app-shell`:
  - The landmark order loses the footer.
  - The requirement "The footer shows the safety disclaimer" is removed.
  - The language-switch scenario no longer mentions the footer.
- `site/map`:
  - The map fills the viewport below the header, and the page does not scroll.
  - A floating "Add a site" link sits on the map.
- `site/search`:
  - The filters toggle is used at every width, and filters are collapsed by default.
  - Active filters show as removable chips.
  - The count stays in view.
  - The narrow-screen requirement becomes the phone layout: floating search, a filters
    dialog, and a results sheet with peek and expanded states.
- `site/details`: the disclaimer box is no longer described as "in addition to the footer".
- `shared/accessibility`: the audit also scans the disclaimer dialog and the phone filters
  dialog while they are open.

## Plan updates absorbed

None (`docs/plan-updates/rework-map-page/` does not exist).

## Impact

- **Front-end only:**
  - `app/AppLayout.tsx`, which drops the footer and adds the disclaimer dialog;
  - `components/AppFooter`, which is removed with its tests;
  - a new `features/disclaimer` (or `components/DisclaimerDialog`);
  - `features/site/MapPage.tsx`, `MapPage.module.css` and `SearchFilters.tsx`;
  - the `en`/`uk` locale strings. The `shell.footer.*` keys move to `shell.disclaimer.*`.
- **Unit tests:**
  - `router.test.tsx` checks for two landmarks;
  - `LanguageSwitch.test.tsx` no longer looks in the footer;
  - `MapPage.test.tsx` covers the new panel, chips, phone dialog and sheet.
- **E2E:**
  - a shared way to start with the disclaimer dismissed;
  - `anonymous-browse.spec.ts` checks the dialog;
  - `audit-accessibility.spec.ts` gains the dialog scans.
- **Perf:** a first Lighthouse visit now opens the dialog. The budgets in `pnpm test:perf`
  are re-run and must still hold.
- **Design:**
  - `design/screens/Map.html` and `MobileMap.html`;
  - `design/system/components/AppFooter`, which is removed;
  - `design/system/bundle.css` if it carries footer styles;
  - `docs/DESIGN.md`.
- **Review findings:** F-03, F-10, F-11 and F-12 are set to `taken: rework-map-page`.
- **Roadmap order:** the roadmap lists `scope-admin-account` before this item. Both change
  the shell, but this item touches only the footer and `AppLayout`, not the header. They
  can be proposed in either order, and they are still applied one at a time.
- **Architecture:** no departure from `docs/ARCHITECTURE.md`; no ADR.
