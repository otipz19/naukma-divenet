# SiteCard

A compact, clickable summary of one dive site, used in map search results, the map marker popup, "visited sites" on profiles and the dive-log site picker.

- **Content, in order:** site name (`h3`), country and region (muted), then one facts row: Rating, difficulty Badge, depth range in `data` style ("6–110 m").
- **The whole card is one link** to `/sites/{id}`; do not nest other links or buttons inside it.
- **Selected state** (the site whose marker is open on the map): `accent-soft` background and a 2px `accent` outline.
- **Popup variant:** the same content inside the map popup at max 280px wide with `shadow-2`; the link text is the site name.
- **Consumer provides:** the site summary from the markers or search endpoint (id, name, country, region, average rating, review count, difficulty, min and max depth).
