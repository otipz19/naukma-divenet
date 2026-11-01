# Tasks

## 1. Back-end

- [ ] 1.1 Add `V12__create_dive_log_entries.sql` and the `divelog.domain` entity and repository (design D1); verify with `DatabaseBaselineIT` and the `ddl-auto=validate` startup.
- [ ] 1.2 Add create, edit and delete with validation and `SiteCatalogService.requireApproved` (design D2, D4, D5). Add `DiveLogApiIT` covering the scenarios of "A signed-in user logs a dive", "An entry is validated" and "Authors edit and delete their own entries"; verify it and `LayeredArchitectureTest` pass.
- [ ] 1.3 Add the log, visited-sites and statistics reads with privacy (design D3). Add `DiveLogPrivacyApiIT` covering the scenarios of "A diver's log is readable within their privacy settings", "Buddies and notes are private to the owner" and "Statistics are readable within the privacy settings"; verify it passes.
- [ ] 1.4 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Dive log page

- [ ] 2.1 Add the route, navigation entry, `DiveLogPage` table and statistics with `en` and `uk` strings. Add Vitest tests with MSW covering "Signed out", "Navigation", "Table", "Date is the logged day" with a UTC-negative check of the formatter, "Empty log", "Load more" and "Failed load"; verify they and the existing navigation tests pass.
- [ ] 2.2 Add `SitePicker` and the form with `en` and `uk` strings. Add Vitest tests covering "Site search", "Logged", "Form errors", "Failed save" and "Site in the URL"; verify they pass.
- [ ] 2.3 Add edit and delete. Add Vitest tests covering "Edit", "Delete" and "Delete not confirmed"; verify they pass.

## 3. Profile and site page

- [ ] 3.1 Add `ProfileDives` to `ProfilePage` (design D6) with `en` and `uk` strings. Add Vitest tests covering every scenario of the `user/profile` delta, asserting that hidden sections make no request; verify they and the existing profile tests pass.
- [ ] 3.2 Add the "Log a dive here" link to `SitePage`. Add Vitest tests covering "Approved site" and "Pending site"; verify they pass.

## 4. Integration

- [ ] 4.1 Update `docs/ARCHITECTURE.md` (existing tables, and the privacy rule); verify against design D1 and D3.
- [ ] 4.2 On the running stack with a fresh test user, in a browser at 1280 px and 375 px, in `en` and `uk` and both themes: go from the map to a site, log a dive there, edit and delete one, turn off `showDiveLog` and check the profile as an anonymous visitor. Use real clicks where the page allows. Fix any gaps; verify with screenshots.
- [ ] 4.3 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [ ] 4.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/add-dive-log/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-dive-log` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
