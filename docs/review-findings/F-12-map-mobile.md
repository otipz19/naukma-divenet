# F-12 Phone map page scrolls and the form covers the map

- **Area:** Map (`/`), below 1100 px
- **Status:** open
- **Delivered by:** `rework-map-page`

## Seen
On a phone, the map page scrolls, and the search form and results cover part of the
map. The UX is poor.

## Cause
The phone layout departs from its mockup. `design/screens/MobileMap.html` draws a
full-screen map, with the search box and a "Filters · 2" button floating over its top
and a draggable results sheet at the bottom. The code (`MapPage.module.css`, the
`max-width: 1099px` block) instead stacks the whole controls block *above* a `70vh`
map (`grid-template-rows: auto 70vh`), so the page height is the controls plus 70vh
plus the footer. The results sheet then lies over the lower 60 % of that map. The
`apply-ui-design` audit did not flag this gap.

## Fix
Build the mockup:
- the map fills the viewport below the header;
- the search and Filters button float over the top of the map;
- filters open in a full-height sheet or dialog with Apply and Clear;
- the results are a bottom sheet with a peek state (the count and one card) and an
  expanded state.

The page itself never scrolls; verify by hand at 390×844 (F-05's automated check was declined).
