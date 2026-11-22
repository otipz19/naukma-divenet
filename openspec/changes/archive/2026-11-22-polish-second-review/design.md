# Design

## Context

See proposal.md - Why. The causes were found in the code during the review
(`docs/review-findings/F-20` to `F-24`):

- `MapPage.module.css`: on a phone, `.topBar` and `.bottomStack` carry `z-index: 1000`
  to sit above Leaflet. Only `.mapSection` is isolated, and `.phone` makes no stacking
  context, so those two compete with the drawer (`NavDrawer.module.css`, `z-index: 30`)
  in the root context and win.
- `MapPage.tsx` (desktop): the panel head holds the search box, a toolbar with the
  Filters button and the chips, then the count; the filters box opens at the top of
  the scrolling body, above the results.
- `.activeChips` wraps at every width; the phone top bar grows with it, and MapPage
  measures it (`measureTopBar`, `--top-bar-height`) to move Leaflet's zoom control down.
- `Toast.tsx`: `TOAST_MS = 6000`; the tests derive their waits from it.
- `DiveTable.tsx`: the actions `<th>` gets `styles.hidden` (absolute, 1 px), which takes
  the whole cell out of the header row.

## Goals / Non-Goals

**Goals:**
- Fix each finding with the smallest change to the existing components.

**Non-Goals:**
- No change to the filters' contents, the phone dialog, the results sheet, the toast's
  placement or content, or the dive log columns.
- No new shared component: the in-place filters are the existing `SearchFilters`.

## Decisions

**D1. Isolate the phone map container.** `.phone` gets `isolation: isolate`, so the map,
its controls, "Add a site" and the sheet form one stacking context below the header (10),
the toasts (20) and the drawer (30). Alternative: lower the controls' `z-index` below
30. Rejected: they must still be above Leaflet's panes (up to 1000) inside the map, which
is what the isolation already gives the desktop `.mapSection`.

**D2. Desktop head order: search, count, then the toggle or the form.** The panel head
renders the search box, the count, and then either the toolbar (Filters button and chips)
or the filters box. The filters box moves out of the scrolling body into the head.
`SearchFilters` gets an optional `onHide` prop: with it, its head row shows "Hide
filters" next to "Clear all". The phone dialog does not pass it.

**D3. Head height is capped.** The side panel keeps its two rows (head, scrolling body).
The head gets `max-height` of 60% of the panel and `overflow-y: auto`, so an open form
scrolls inside the head and the results keep at least 40% of the panel. Alternative: let
the whole panel scroll. Rejected: it breaks "The result count stays in view".

**D4. Focus.** Opening moves focus to the filters group (a `role="group"` named "Filters",
`tabIndex={-1}`), because the button that had focus is gone. "Hide filters" puts focus
back on the Filters button after it renders again (a ref and an effect keyed on the
open state, skipped on first render).

**D5. Chips only on a desktop with the form closed.** The chip list renders only in the
desktop toolbar. On a phone it is not rendered at all, so `.topBar` keeps the height of
the search row. `measureTopBar` stays: the search row still wraps at large text sizes.
The form shows pressed chips itself, so the removable chips are dropped while it is open.

**D6. Toast lifetime.** `TOAST_MS = 10000`. The tests keep deriving their waits from the
constant and their names change to 10 seconds; one test checks the toast is still there
at 9 s.

**D7. Dive log actions header.** The `<th>` stays in the row with the header background;
its text goes into a visually-hidden `<span>` inside it.

**D8. Tests for layout.** jsdom does not lay out, so F-20 is checked in the E2E suite (a
390 px page, open the drawer, `document.elementFromPoint` at the search box centre is
inside the drawer). F-24 is checked in Vitest (header cells equal row cells; the last is
a column header named "Actions"). Both run in CI.

i18n: one new key `site.search.hideFilters` ("Hide filters" / "Сховати фільтри") in `en`
and `uk`. No REST endpoint, Flyway migration or i18n namespace change.

## Risks / Trade-offs

- [A long filters form in a short window leaves the head scrolling] → D3 caps it; the
  count stays at the head's top before the form.
- [Users on a phone no longer remove one filter in one tap] → owner's decision (F-22);
  the dialog still toggles each filter and has "Clear all".
- [Design mockup drift] → `design/screens/Map.html`, the Chip and Toast READMEs and
  `docs/DESIGN.md` are updated in this change.
