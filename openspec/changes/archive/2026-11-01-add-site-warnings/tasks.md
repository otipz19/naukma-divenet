# Tasks

## 1. Schema and domain

- [x] 1.1 Add `V10__create_warnings.sql` (design D1), the `warning.domain` entity `Warning` with `WarningType` and `WarningRepository` with the visible-only queries (design D2). Add `WarningRepositoryIT` checking the type CHECK, the non-blank text CHECK, the hidden-at/hidden-by pairing CHECK, and that `findVisibleBySite` and `findVisibleById` skip hidden rows and order newest first; verify it and `LayeredArchitectureTest` pass.

## 2. Warning API

- [x] 2.1 Add `WarningService.list`, `get` and `create`, `WarningExceptions` (404, 403), `WarningView` and `WarningController` for `GET /sites/{siteId}/warnings`, `POST /sites/{siteId}/warnings` and `GET /warnings/{id}`, with `type` as a validated string (design D3, D4, D5). Add `WarningApiIT` covering every scenario of "Signed-in users post a warning to an approved site", "A warning has a known type and a text", "Everyone reads a site's warnings" and "Everyone reads one warning"; verify it passes.
- [x] 2.2 Add `WarningService.update` and `delete` and the PUT and DELETE endpoints with the author check. Extend `WarningApiIT` with every scenario of "Authors edit their warning" and "Authors delete their warning"; verify it passes.
- [x] 2.3 Add `WarningService.hide` and `WarningModerationController` for `POST /admin/warnings/{id}/hide` (design D2, D5). Extend `WarningApiIT` with every scenario of "Admins hide a warning" and "A hidden warning is gone for its author"; verify it passes and that `site` and `user` have no import from `warning`.
- [x] 2.4 Regenerate `api/openapi.json` (`ApiContractTest -Dopenapi.update=true`) and `frontend/src/api/schema.gen.ts` (`api:types`); verify `ApiContractTest` and `api:types:check` pass, `WarningRequest.type` is the four-value union and every `WarningResponse` field is required.

## 3. Warnings section on the site page

- [x] 3.1 Add `features/warning/relativeDate.ts` (design D6). Add `relativeDate.test.ts` with a fixed clock covering today, yesterday, n days ago, the 30-day boundary and the date after it in `en` and `uk`, and every scenario of "The time since posting is relative for a month"; verify it passes.
- [x] 3.2 Add the optional `actions` slot to `components/Alert` without changing its other props. Extend the Alert test (or add `Alert.test.tsx`) for "actions render after the body"; verify it and the existing Alert users' tests pass.
- [x] 3.3 Add `features/warning/api.ts`, `SiteWarnings` and `WarningAlert` with the tone map, rendered by `SitePage` before "About this site" for approved sites only, and the `warning.*` section strings in `en` and `uk` (design D6, D7). Add `SiteWarnings.test.tsx` (MSW) covering every scenario of "The site page shows recent warnings", "A warning's tone follows its type", "Only the two newest warnings show at first" and "The section offers to report a warning", and extend `SitePage.test.tsx` with "Section placement" and "Unapproved site"; verify they pass.
- [x] 3.4 Add Edit and Delete on own warnings and Hide for admins, each Delete and Hide with an inline confirmation, and the strings in `en` and `uk`. Extend `SiteWarnings.test.tsx` with every scenario of "Authors manage their warnings on the site page" and "Admins hide warnings on the site page"; verify it passes.

## 4. Warning form

- [x] 4.1 Add `WarningFormPage` with `warningSchema.ts` (zod), `SelectField` and `TextAreaField` at `sites/:id/warnings/new` and `sites/:id/warnings/:warningId/edit` behind `RequireAuth`, wired into `src/app/router.tsx`, and the `warning.form.*` strings in `en` and `uk` (design D6, D7). Add `WarningFormPage.test.tsx` (MSW) covering every scenario of `warning/warning-form`; verify it passes.
- [x] 4.2 Run the front-end dev server against the local API, in both languages and both themes, at desktop and phone width: report, edit and delete a warning as a user, hide one as the admin, and expand "Show all warnings". Compare the section with `design/screens/Site.html` and `MobileSite.html`, fix any gaps and verify with screenshots.

## 5. Docs, plan updates and integration

- [x] 5.1 Update `docs/ARCHITECTURE.md`: `warnings` in the existing-tables sentence and `users ||--o{ warnings : posts` in the ER diagram; verify the diagram matches `V10__create_warnings.sql`.
- [x] 5.2 Check that the plan-update notes written at proposal time (`docs/plan-updates/add-diver-profile/add-site-warnings--warning-author-link.md`, `docs/plan-updates/apply-ui-design/add-site-warnings--no-warnings-moderation-tab.md`) still match what was built (field names, file paths); verify `node scripts/check-plan-updates.mjs` passes.
- [x] 5.3 Run `pnpm check` from the repository root and confirm it exits 0.
- [x] 5.4 Update the `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` and validate with `openspec validate --all --strict`.
- Archive on `change/add-site-warnings` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
