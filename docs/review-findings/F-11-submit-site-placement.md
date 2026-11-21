# F-11 "Submit a site" sits inside the search form

- **Area:** Map (`/`)
- **Status:** open
- **Delivered by:** `rework-map-page`

## Seen
The "Submit a site" button is the first item of the search-and-filter panel. It reads
as part of the search, which it is not.

## Cause
`MapPage.tsx` puts the link at the top of the `controls` section, labelled
"Search and filters".

## Fix options
1. *(Recommended)* A floating action on the map itself: "+ Add a site" at the
   map's corner, which is where a user thinks about a new location. It opens
   `/sites/new`, and the picker could start at the current map centre.
2. Move it to the account menu (signed in) next to "My dive log". That keeps the map
   clean, but visitors would never discover it.
