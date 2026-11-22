# F-20 Map controls float over the open navigation drawer on a phone

- **Area:** Map, app shell
- **Status:** done: polish-second-review
- **Delivered by:** `polish-second-review` (see the index)

## Seen
On a phone, with the navigation drawer open on the map page, the search box, the
Filters button, "Add a site" and the results sheet are drawn on top of the drawer.

## Cause
`MapPage.module.css`: on a phone the floating `.topBar` and `.bottomStack` have
`z-index: 1000` so they sit above Leaflet's panes. Only `.mapSection` is isolated
(`isolation: isolate`); its siblings `.topBar` and `.bottomStack` live in `.phone`,
which makes no stacking context. So their `z-index: 1000` competes in the root
stacking context with the drawer (`NavDrawer.module.css`, `z-index: 30`) and wins.
The desktop layout is not affected: there "Add a site" sits inside the isolated
`.mapSection`.

## Fix
Give `.phone` its own stacking context (`isolation: isolate`), so everything on the
map stays below the header (10), the toasts (20) and the drawer (30). No behaviour
change; the existing MapPage tests stay.
