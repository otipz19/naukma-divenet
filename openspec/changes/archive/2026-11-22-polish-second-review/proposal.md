# Proposal

## Why

After `polish-release` the owner walked the app again and found five rough edges
(review findings F-20 to F-24 in `docs/review-findings`). Two are visual defects, and
three come from how the map filters and toasts were specified. M6 should end on a
demo without them.

## What Changes

- **Phone map controls stay under the drawer (F-20).** With the navigation drawer
  open on the map page, the drawer covers the search bar, the Filters button,
  "Add a site" and the results sheet. Today they draw on top of it.
- **Desktop filters open in place (F-21, owner's decision).** In the side panel the
  number of matches moves above the Filters button. Pressing Filters replaces the
  button with the filters form in the same place, in the search section of the panel,
  not above the results. The form has a "Hide filters" button that closes it and brings
  the Filters button back, with focus on it. The results keep scrolling on their own
  below. The phone keeps its filters dialog.
- **No active-filter chips on a phone (F-22, owner's decision).** On a phone the
  removable chips under the search bar are not shown; the Filters button's count and
  the filters dialog show what is selected. The desktop panel keeps the chips while the
  filters form is closed.
- **Toasts stay 10 s (F-23, owner's decision).** Every toast closes on its own after
  about 10 seconds instead of 6. Hover and focus still pause the timer, and the close
  button stays.
- **Dive log header covers the actions column (F-24).** The table header row has its
  background above the Edit and Delete buttons too; the column header stays hidden
  from sight but is still read by screen readers.

Stories: US-05, US-06 (map search and filters), US-09 (dive log table), US-10
(achievement toasts).

Out of scope: any other change to the map, the filters' contents, the toast's
content or placement, and the dive log table's columns. No back-end or API change.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `site/search`: the desktop filters open in place of the Filters button with a Hide
  button, the count sits above the button, the chips show only on a desktop while the
  filters are closed, and the phone's floating controls stay under the navigation drawer.
- `shared/app-shell`: toasts close on their own after about 10 seconds.
- `divelog/log-page`: the table's header row spans the actions column.

## Impact

- Front-end only: `features/site/MapPage.tsx` and its CSS, `features/site/SearchFilters.tsx`,
  `components/Toast/Toast.tsx`, `features/divelog/DiveTable.tsx` and `DiveLog.module.css`,
  their Vitest tests, the `en` and `uk` locales (one new string: "Hide filters"), and E2E
  checks for the two layout defects.
- Design: `design/screens/Map.html` (panel order), `design/system/components/Toast/README.md`
  (lifetime), `design/system/components/Chip/README.md` (removable chips are desktop only),
  `docs/DESIGN.md` screen description.
- Docs: `docs/review-findings` statuses for F-20 to F-24.
- No REST endpoint, migration or ADR change.

## Plan updates absorbed

None (`docs/plan-updates/polish-second-review/` does not exist).
