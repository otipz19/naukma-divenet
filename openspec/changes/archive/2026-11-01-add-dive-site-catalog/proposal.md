# Proposal

## Why

DiveNet's core promise is finding dive sites on a map, and `/` is still a placeholder.
This change delivers the first visible product: US-01 (browse the map) and the part of
US-02 (site details) that does not depend on later milestones.

## What Changes

- Add the `sites` table with a PostGIS location, a region, a declared difficulty, a
  depth range, a description, and required and recommended gear.
- Add public read endpoints: `GET /api/v1/sites/markers` and `GET /api/v1/sites/{id}`.
- Replace the placeholder at `/` with a world map with clustered markers. Clicking a
  marker opens a summary that links to the site page.
- Add the site page at `/sites/:id`, including its safety disclaimer box.
- Add a `demo`-profile seeder with about 50 real sites, and turn that profile on by default
  in the compose stack so the demo is never empty.
- Add the front-end dependencies `leaflet`, `react-leaflet` and `leaflet.markercluster`
  (already chosen by ADR-0005). This edits `frontend/package.json` and `pnpm-lock.yaml`;
  approving this proposal approves that edit.
- **BREAKING (spec only):** the `shared/web-app` placeholder home page requirement is removed.

Deferred, by the change that delivers it:

- `add-site-search-and-filters`: search, filters, the result list and the map's side panel.
- `add-site-submission-and-moderation`: site authors and moderation status. Until then
  every site is public, because only the seeder creates sites.
- `add-site-reviews`: average rating and community difficulty, and "Write a review".
- `add-media-uploads` and `add-site-reviews`: photos on the page.
- `add-site-warnings`, `add-feeds`, `add-dive-log`: warnings, linked posts and "Log a dive here".
- `complete-demo-seed`: the rest of the demo content.

There is no departure from `docs/ARCHITECTURE.md`, so no new ADR.

## Capabilities

### New Capabilities

- `site/catalog`: site data, how clients read it, and the demo seed.
- `site/map`: the map page, clustering and marker summaries.
- `site/details`: the site page.

### Modified Capabilities

- `shared/web-app`: `/` no longer renders the placeholder.
- `shared/local-stack`: the stack starts with the demo data by default.

## Impact

- **Database:** migration `V5__create_sites.sql`.
- **Back-end:** `site` package gains the site entity, service, controller and `demo` seeder; seed file under `src/main/resources/seed/`.
- **API:** two new public GET endpoints; regenerated `api/openapi.json` and `frontend/src/api/schema.gen.ts`.
- **Front-end:** new `features/site`, shared `SiteCard` and `Badge` components, routes, `en` and `uk` strings. `HomePage` and its keys are removed.
- **Stack:** `compose.yaml`, `.env.example`, `scripts/check-compose.mjs`. The map needs internet access for OpenStreetMap tiles.
- **Docs:** `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/HANDOFF.yaml`.
