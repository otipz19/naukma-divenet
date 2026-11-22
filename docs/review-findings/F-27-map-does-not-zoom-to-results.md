# F-27 The map does not zoom to the search results

- **Area:** Map
- **Status:** done: polish-demo-walkthrough (owner decided 2026-11-22)
- **Delivered by:** `polish-demo-walkthrough` (see the index)

## Seen
With the "Technical" filter on, the list shows two sites, but the map stays on the
whole world with one small cluster near Mexico.

## Cause
`features/site/SiteClusterLayer.tsx` redraws the markers when the results change but
never moves the map.

## Fix (owner's decision)
After a search or filter change, the map fits the matching sites in view, with a zoom
limit so a single site is not shown at street level. Opening the map with no search
and no filters keeps the world view.
