# F-03 Remove the footer; disclaimer in a first-visit modal

- **Area:** App shell
- **Status:** done: rework-map-page (decided: owner: remove the footer, add a modal)
- **Delivered by:** `rework-map-page`

## Seen
On `/`, the footer pushes the page past the viewport, so the browser adds a vertical
scrollbar. The map page should not scroll; only its side panel should.

## Cause
`frontend/src/features/site/MapPage.module.css` sets `.layout { height: 90vh }`,
which ignores the header's height. The shell (`AppLayout`) then always adds the footer
below it. On a narrow window, the disclaimer makes the footer about 376 px tall.

## Decision
Remove the footer from every page. On the first visit, show the safety disclaimer in
a modal dialog with a "Don't show again" checkbox and a close button. The map fills
the viewport below the header (`100dvh` minus the header height).

## What has to change
- **Spec `shared/app-shell`:** the requirement "The footer shows the safety disclaimer"
  (no dismiss control, on every page) is replaced by a modal requirement. The modal
  opens on the first visit and can be dismissed, and "Don't show again" is stored per
  browser in `localStorage` (a convenience, not a record; if storage fails, the modal
  just shows again). The shell's landmark order loses the footer.
- **Disclaimer stays in scope:** PRODUCT.md lists the disclaimer, and the
  non-dismissible box on the site page (spec `site/details`) stays. That is where a diver
  judges a site, so the safety message is still always shown in the right place.
- **OpenStreetMap attribution:** the licence requires it. It stays on every tiled map
  through Leaflet's attribution control (the map page and the submit-site picker).
- **"NaUKMA course project" line:** moves into the modal, under the disclaimer.
- **Modal a11y:** it is a native `<dialog>` with focus moved into it, Escape to close
  and a translated title. It must pass the axe audit in both themes and in `uk`.
- **Tests:** `AppFooter` tests are removed; modal unit tests are added; e2e journeys
  close or pre-dismiss the modal; the a11y audit covers the open modal.
- **Design:** update `docs/DESIGN.md` and the shell component spec in `design/`.
