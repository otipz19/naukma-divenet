# Tasks

## 1. Back-end

- [x] 1.1 Add `V7__add_site_moderation.sql` and the status, author and reason on `Site` (design D1), and update test helpers that insert sites. Verify with `SiteApiIT`, `SiteDemoSeederIT` (seeded sites are approved) and `DatabaseBaselineIT`.
- [x] 1.2 Hide unapproved sites from markers and from `GET /sites/{id}` (design D3), and add `status` and `rejectionReason` to the response. Cover "Unapproved sites are hidden", "Pending site for others" and "Pending site for its author and admins" in `SiteVisibilityApiIT`; verify it passes.
- [x] 1.3 Add `POST /sites` and `GET /sites/mine` with validation (design D2, D4) and the security rule. Add `SiteSubmissionApiIT` covering every server scenario of spec `site/submission`; verify it and `LayeredArchitectureTest` pass.
- [x] 1.4 Add the admin endpoints. Add `SiteModerationApiIT` covering every server scenario of spec `site/moderation`; verify it passes.
- [x] 1.5 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Front-end foundations

- [x] 2.1 Add `RequireAuth`, `TextAreaField`, the status badge, and `en` and `uk` strings. Add Vitest tests for each guard state and the field's label; verify they pass.
- [x] 2.2 Make `SitePage` wait for the session and show the status notice. Add Vitest tests covering "Pending site", "Rejected site", "Approved site" and "Reload by the author"; verify they and the existing site-page tests pass.

## 3. Submission page

- [x] 3.1 Add `SubmitSitePage` with its schema, location picker and submissions list, and the map-panel link (design D6). Add Vitest tests with MSW covering every page scenario of spec `site/submission`; verify they pass.

## 4. Moderation page

- [x] 4.1 Add `ModerationPage` and the admin menu links (design D6). Add Vitest tests with MSW covering every page scenario of spec `site/moderation`; verify they pass.

## 5. Integration

- [x] 5.1 Update `docs/ARCHITECTURE.md` (the ER diagram and the moderation visibility rule); verify against design D1 and D3.
- [x] 5.2 On the running stack, in a browser at 1280 px and 375 px, in `en` and `uk` and both themes where practical, using test credentials from `.env.example`: register a test user, submit a site by clicking the map, log in as the demo admin, reject one and approve one, then check the author's list and the public map. Fix any gaps; verify with screenshots.
- [x] 5.3 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [x] 5.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-site-submission-and-moderation` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
