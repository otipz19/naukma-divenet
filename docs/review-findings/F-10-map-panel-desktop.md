# F-10 Desktop map panel: filters crowd out the results

- **Area:** Map (`/`), desktop
- **Status:** decided (owner, 2026-11-21)
- **Delivered by:** `rework-map-page`

## Seen
The filters take most of the side panel and cannot be collapsed on desktop. The
"N sites found" line and the result list start below the fold, so the user scrolls
the panel before seeing any result of their search.

## Cause
`MapPage.tsx` stacks, in one scrolling panel (`.side`): the Submit button, the search
box, the full `SearchFilters` (difficulty chips, gear chips, country, region, depth
pair, minimum rating), then the results header and list. The Filters toggle exists,
but CSS shows it only below 1100 px (`.filtersToggle`, `.closedOnNarrow`).
`design/screens/Map.html` itself draws the filters always open, so this is design
debt as well as code.

## Fix
- Use the Filters toggle at every width. Filters are collapsed by default, and the
  toggle shows the active count ("Filters · 2"). Active filters show as removable
  chips under the search box.
- The panel becomes a fixed header (search, toggle, count) above a list that scrolls
  on its own, so the count and the first results are always in view.
- Update `design/screens/Map.html` to match.
