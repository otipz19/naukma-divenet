# Design

## Context

See proposal.md for motivation. Reference data exists with string codes (`regions.code`,
`gear_items.code`), and the UI translates codes through the locale files
(`add-reference-data` D3). `hibernate-spatial` is already a dependency. `/` renders
`HomePage`, a placeholder. The UI has no Badge or SiteCard yet; `design/system/components`
specifies both. No map library is installed.

## Goals / Non-Goals

**Goals:**

- A demo that opens on a populated world map and reaches a useful site page in one click.
- A data model that the later M1 and M2 changes extend without rework.

**Non-Goals:**

- Viewport queries: the markers endpoint returns everything and the client clusters
  (`ARCHITECTURE.md`).
- Placeholder sections for features that do not exist yet. The page shows no empty
  Reviews or Warnings sections and no disabled buttons; each later change adds its own.

## Decisions

### D1: Schema

`V5__create_sites.sql`:

```sql
sites (
  id bigint identity PK,
  name varchar(120) NOT NULL,
  region_code varchar(50) NOT NULL REFERENCES regions,  -- indexed
  location geography(Point,4326) NOT NULL,              -- GiST index
  difficulty integer NOT NULL CHECK (1..5),
  min_depth integer NOT NULL CHECK (>= 0),
  max_depth integer NOT NULL, CHECK (min_depth <= max_depth),
  description text NOT NULL,
  created_at timestamptz NOT NULL
)
site_gear (
  site_id bigint REFERENCES sites ON DELETE CASCADE,
  gear_code varchar(50) REFERENCES gear_items,
  requirement varchar(16) NOT NULL CHECK (IN ('REQUIRED','RECOMMENDED')),
  PRIMARY KEY (site_id, gear_code)
)
```

The composite key is what stops a gear item from being both required and recommended.
Depths are whole metres, matching the mockups. PostGIS coerces out-of-range `geography`
values instead of refusing them, so the database cannot enforce the coordinate range; only
the seeder writes sites here, and `add-site-submission-and-moderation` must validate
`lat` and `lng` at its API. Status, author and aggregates are not added here;
the changes that use them add their own migrations.

`Site` maps `@ManyToOne Region` and `Point location`. Gear is mapped as an `@ElementCollection`
of embeddables, since `site_gear` rows have no life of their own.

### D2: API

| Endpoint | Response |
| --- | --- |
| `GET /api/v1/sites/markers` | `[{ id, name, lat, lng, countryCode, regionCode, difficulty, minDepth, maxDepth }]` |
| `GET /api/v1/sites/{id}` | marker fields + `{ description, requiredGear: [code], recommendedGear: [code] }` |

Responses carry codes only, because the UI translates them. Response records in `site.web`
use `@Schema(requiredProperties)`, as `AuthDtos` and the reference-data controllers do. The
markers query reads a projection with a `join fetch` of region and country, so the list makes
one query. A missing site raises a `SiteNotFoundException` (an `ErrorResponseException`, as in
`AuthExceptions`), which gives a 404 problem detail.

### D3: Difficulty words

PRODUCT.md declares difficulty 1 to 5; the Badge spec has four words. Mapping: 1 Beginner,
2–3 Intermediate, 4 Advanced, 5 Technical, with the Badge tones of its README. It lives in one
front-end helper. The stored value stays 1 to 5, so a fifth word needs only that helper.

### D4: Clustering with `leaflet.markercluster` directly

The map uses `react-leaflet` for the container, tiles and popup. A small `SiteClusterLayer`
component calls `useMap` and adds an `L.markerClusterGroup` holding `L.marker`s with
`L.divIcon`s. Divicons avoid Leaflet's default image icons, which break under Vite, and take
their colours from tokens through CSS classes, matching the mockup's pins and round clusters.

Clicking a marker sets `selected` state; the page renders a react-leaflet `<Popup>` for it.
That popup renders through a React portal, so the router and i18n contexts reach `SiteCard`.
Alternative: `react-leaflet-cluster`. Rejected: one more wrapper dependency for about 30 lines.

Tests run real Leaflet in jsdom: they read the layer's markers and clusters, and fire `click`
on a marker. Real tile loading and pixel layout are not covered until E2E in M6, so apply also
checks the page in a browser against the stack.

### D5: Page layout and the design

- **Footer on the map page:** DESIGN.md says the map page has no footer, but the archived
  spec `shared/app-shell` requires a footer on every route. The spec wins, so the map fills the
  space above the existing footer, which already holds the disclaimer and OSM credit.
- **Side panel and bottom sheet:** they hold search, filters and results, so
  `add-site-search-and-filters` adds them. The map takes the full width until then.
- **Popup:** SiteCard's popup variant, without Rating until `add-site-reviews`.
- **Site page:** follows `Site.html` for the breadcrumb, heading, facts card, gear and
  disclaimer box. The mockup's "TYPE" fact is omitted: no story or domain decision defines it.
- **Zoom controls:** Leaflet's defaults, restyled with tokens in the map's CSS module.
- `import "leaflet/dist/leaflet.css"` comes from `node_modules`, outside the tokens-only CSS gate.

Components: `components/Badge`, `components/SiteCard`, `features/site/{MapPage, SiteClusterLayer,
SitePage, DifficultyBadge, routes, api hooks}`. `MapPage` is the index route; `app/routes/HomePage`
and `home.placeholder` go. Everything site-related is lazy-loaded with the route only if the
build warns about size; otherwise it stays plain.

### D6: Demo seeder

`SiteDemoSeeder` (`site.service`, `@Profile("demo")`, `ApplicationRunner`) reads
`src/main/resources/seed/sites.json` and inserts through the repository when `sites` is empty.
Entries refer to regions and gear by code, so an unknown code fails startup loudly.
`compose.yaml` passes `SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-demo}`;
`scripts/check-compose.mjs` checks both scenarios.

The seed holds about 50 well-known real sites with English descriptions written for this
project, not copied from elsewhere. User content is not translated, so there is no `uk` copy.

### i18n

No new namespace. New key groups: `site.map.*`, `site.details.*`, `site.difficulty.*`,
`site.errors.*`. Removed: `home.placeholder`.

## Risks / Trade-offs

- [Seed coordinates and depths come from general knowledge, not a survey] → Coordinates are
  rounded and the disclaimer already says the data is for reference. This is demo content.
- [The map needs internet access for tiles] → Markers still load without tiles; have a network
  at the demo. OSM's tile policy suits low-traffic use like this, with attribution shown.
- [Leaflet in jsdom has no real layout] → D4's tests check layers and popups, not pixels; a browser
  check covers the rest until M6.
- [Change size] → It spans schema to UI as one roadmap item. Its parts cannot show anything
  alone, and the task groups keep them reviewable in order.
- [All sites are public with no moderation state] → Only the seeder creates sites until
  `add-site-submission-and-moderation`, which adds the status with existing rows approved.

## Migration Plan

Forward-only migration adding new tables. An existing compose database gets the seed on the
next start, because `sites` is empty.

## Implementation notes

- `site.domain` needs `@JdbcTypeCode(SqlTypes.GEOGRAPHY)` for `ddl-auto=validate` to accept the `geography` column.
- Marker icons rotate an inner element: CSS `rotate` on the icon itself also rotates Leaflet's `transform` position and misplaces the pin. jsdom cannot show this; the browser check caught it.
- `DifficultyBadge` lives in `components/Badge`, not `features/site`, so the shared `SiteCard` does not depend on a feature.
- SiteCard's selected state is not built; nothing selects a card until the result list exists.
- The map page cancels the footer's top margin, so the map meets the footer.
- Local browser check used `WEB_PORT=18080`, because 8080 was taken on the machine.
