# Proposal

## Why

The map shows every site at once, so a diver cannot narrow it to what suits them. This
change delivers US-06 (search) and US-05 (combinable filters), reflected on the map and in
a result list. It also settles Ukrainian place-name search, which `add-reference-data` left
open.

## What Changes

- `GET /api/v1/sites/markers` gains optional parameters: text search, difficulty, required
  gear, country, region and depth range. With none, it behaves as today.
- Add a `pg_trgm` index for name search (migration V6).
- Add the map page's search box, filters and result list, with a "nothing found" message.
  On wide screens they form a side panel; below 1100 px, a bottom sheet and a filters toggle.
- Keep the search and filters in the URL, so a filtered map can be shared and survives a reload.
- Add shared `Chip` and `SelectField` components.

Deferred:

- **The minimum-rating filter of US-05 and sorting by rating:** no ratings exist yet.
  They move to `add-site-reviews`, and this PR adds them to that item in `docs/ROADMAP.md`.
  Results are sorted by name until then.
- **A separate paged `GET /api/v1/sites`:** the markers response already holds what the result
  list shows. See design D1.

There is no departure from `docs/ARCHITECTURE.md`, so no new ADR.

## Capabilities

### New Capabilities

- `site/search`: search and filter behaviour on the server and on the map page.

### Modified Capabilities

- `site/catalog`: the markers endpoint returns the matching sites, and every site only when no filter is given.

## Impact

- **Database:** migration `V6__add_site_name_trigram_index.sql`.
- **Back-end:** filter parameters on `SiteController`, a filter in `SiteCatalogService`, a query in `site.domain`.
- **API:** new optional query parameters; regenerated `api/openapi.json` and `frontend/src/api/schema.gen.ts`. Not breaking.
- **Front-end:** `features/site` map page, new `components/Chip` and `components/SelectField`, `en` and `uk` strings, test server defaults.
- **Docs:** `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/HANDOFF.yaml`.
- **Dependencies:** none added.
