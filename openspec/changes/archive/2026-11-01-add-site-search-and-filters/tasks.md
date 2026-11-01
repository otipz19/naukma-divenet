# Tasks

## 1. Server filters

- [x] 1.1 Add `V6__add_site_name_trigram_index.sql`, `SiteFilter` and the specification, and the controller parameters (design D1, D2), with markers ordered by name. Add `SiteSearchApiIT` covering "Markers are ordered by name" and every server scenario of spec `site/search`; verify it, `SiteApiIT` and `LayeredArchitectureTest` pass.
- [x] 1.2 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Shared components

- [x] 2.1 Add `components/Chip` and `components/SelectField`, and SiteCard's selected state, from the design READMEs. Add Vitest tests for pressed state, label linkage and selected state; verify they pass.

## 3. Search state

- [x] 3.1 Add the URL state, query mapping and name-to-code matching (design D3, D4) as tested functions in `features/site`. Add unit tests covering "Intermediate covers two levels", "Search in Ukrainian", ignored URL values and non-numeric depths; verify they pass.

## 4. Map page

- [x] 4.1 Add the search box, filters, result list, count and nothing-found message to the map page with `en` and `uk` strings, and default test-server handlers for countries and gear. Add Vitest tests with MSW covering "Filter applied", "Regions follow the country", "Clear all", "Nothing found", "Opening a filtered URL", and that the popup closes when its site leaves the results; verify they and the existing map tests pass.
- [x] 4.2 Add the narrow-screen filters toggle and results sheet (design D5) with `en` and `uk` strings. Add a Vitest test covering "Toggles report their state"; verify it passes.

## 5. Integration

- [x] 5.1 Update `docs/ARCHITECTURE.md` to describe the markers parameters and the search-through-codes rule; verify against design D1 and D3.
- [x] 5.2 Open the running stack in a browser at 1280 px and 375 px, in `en` and `uk`, in the light and dark themes: search, combine filters, reload a filtered URL, and search "дахаб". Fix any gaps; verify with screenshots.
- [x] 5.3 Run `pnpm check` from the repository root and confirm it exits 0.
- [x] 5.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-site-search-and-filters` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
