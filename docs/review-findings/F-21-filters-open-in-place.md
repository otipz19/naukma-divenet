# F-21 The Filters button opens the filters below it, under the count

- **Area:** Map (desktop side panel)
- **Status:** taken: polish-second-review (owner decided 2026-11-22)
- **Delivered by:** `polish-second-review` (see the index)

## Seen
On a desktop the Filters button sits in the panel head, then the "Sites found" count,
and the filters open further down, in the scrolling body above the results. It is not
clear that the button opened them.

## Cause
This was built as specified. `rework-map-page` put the toggle and chips in the fixed
head and the filters box at the top of the scrolling body (`MapPage.tsx`;
spec `site/search` "Filters sit behind a toggle at every width": "On a desktop it
expands the filters in the side panel").

## Fix (owner's decision)
- The "Sites found" count moves above the Filters button.
- Pressing Filters replaces the button with the filters form in the same place, in the
  search section of the panel (not the results section).
- The form has its own Hide filters button; pressing it closes the form and the Filters
  button comes back, keeping focus on it.
- The results stay below and keep scrolling on their own; the head must not push them
  out of view (the form may scroll inside the head when it is taller than the space).
- Spec change in `site/search` ("Filters sit behind a toggle at every width") and its
  tests. The phone keeps its filters dialog.
