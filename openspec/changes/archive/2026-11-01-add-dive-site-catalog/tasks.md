# Tasks

## 1. Site data and API

- [x] 1.1 Add `V5__create_sites.sql` and the `site.domain` entity and repository (design D1). Cover "Invalid difficulty", "Depths in the wrong order" and "Gear listed twice" in `SiteApiIT`; verify it passes.
- [x] 1.2 Add the `site.service` read service, `SiteNotFoundException` and the `site.web` controller for both endpoints (design D2). Add `SiteApiIT` covering "Anonymous client reads the markers", "Anonymous client reads a site" and "Unknown site"; verify it and `LayeredArchitectureTest` pass.
- [x] 1.3 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Demo seed and stack

- [x] 2.1 Write `seed/sites.json` with at least 50 real sites covering every country, and `SiteDemoSeeder` (design D6). Add `SiteDemoSeederIT` covering the three demo-profile scenarios; verify it passes.
- [x] 2.2 Pass `SPRING_PROFILES_ACTIVE` in `compose.yaml`, document it in `.env.example`, and check both "Variable" scenarios in `scripts/check-compose.mjs` with a script test; verify the test passes and that removing the variable fails the compose step.

## 3. Shared components

- [x] 3.1 Add `leaflet`, `react-leaflet` and `leaflet.markercluster` with their types to `frontend/package.json`; verify `pnpm install --frozen-lockfile` succeeds with the new lockfile.
- [x] 3.2 Add `components/Badge` and `components/SiteCard` from their design READMEs, and the difficulty helper with `en` and `uk` strings (design D3). Add Vitest tests covering "Each level maps to a word" and SiteCard's link and content; verify they pass.

## 4. Map page

- [x] 4.1 Add `features/site/MapPage` and `SiteClusterLayer` as the index route, remove `HomePage` and `home.placeholder`, and add `en` and `uk` strings (design D4, D5). Add Vitest tests with MSW covering "Map loads", "Close markers at a low zoom", "Marker clicked", "Summary in Ukrainian" and the map's "API error"; update the existing tests that expect the placeholder; verify they pass.

## 5. Site page

- [x] 5.1 Add `features/site/SitePage` at `/sites/:id` with `en` and `uk` strings (design D5). Add Vitest tests with MSW covering "Site page renders", "Southern and western coordinates", "Gear in Ukrainian", "Site with no gear", "Disclaimer box", "Breadcrumb", "Unknown site" and the page's "API error"; verify they pass.

## 6. Integration

- [x] 6.1 Update `docs/ARCHITECTURE.md` (existing tables, the `sites` and `site_gear` relation) and verify the ER diagram matches `V5__create_sites.sql`.
- [x] 6.2 Run `pnpm smoke:stack`, because `compose.yaml` changed; verify it exits 0.
- [x] 6.3 Open the running stack in a browser in both languages, at desktop and phone width: the map shows clusters and tiles, a popup links to the site page, and the page matches `design/screens/Site.html` for the sections built here. Fix any gaps; verify with screenshots.
- [x] 6.4 Run `pnpm check` from the repository root and confirm it exits 0.
- [x] 6.5 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-dive-site-catalog` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
