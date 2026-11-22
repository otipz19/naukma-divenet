# F-22 Active-filter chips stack up and cover the phone map

- **Area:** Map (phone)
- **Status:** done: polish-second-review
- **Delivered by:** `polish-second-review` (see the index)

## Seen
On a phone with many filters (13 in the screenshot, `uk`) the removable chips wrap into
seven rows under the search bar and cover most of the map.

## Cause
`.activeChips` is `flex-wrap: wrap` at every width, and the floating `.topBar` grows
with it (`MapPage.tsx` even measures that height to move Leaflet's zoom control down).
Nothing limits it.

## Fix (owner, 2026-11-22)
On a phone the active-filter chips are not shown. The Filters button already shows the
count ("Filters · 13"), and the filters dialog shows the selected filters and "Clear
all". The floating top bar keeps the height of the search row. The desktop panel keeps
its removable chips. Spec change in `site/search`.
