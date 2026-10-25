# AppFooter

The navy band at the bottom of every page except the full-screen map, carrying the safety disclaimer required on every page.

- **Content:** the safety disclaimer (bold lead "Safety:" then the sentence), then a meta line: "DiveNet · NaUKMA course project" and "Map data © OpenStreetMap contributors".
- **Map page:** the map fills the viewport, so the footer is replaced by a one-line disclaimer strip in `caption` style inside the side panel, under the results. The rule "the footer shows the safety disclaimer" is satisfied by that strip.
- **Text** comes from the locale files; the disclaimer is never hidden or dismissible.
- **Consumer provides:** nothing; it is static.
