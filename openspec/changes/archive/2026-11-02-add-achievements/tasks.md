# Tasks

## 0. Plan updates

- [x] 0.1 Apply the roadmap edits asked for by the notes in `docs/plan-updates/add-achievements/`, and delete the notes; done with this proposal.

## 1. Back-end

- [x] 1.1 Add `V16__create_achievements.sql` and the `achievement.domain` entities and repositories (design D1); verify with `DatabaseBaselineIT` and the `ddl-auto=validate` startup.
- [x] 1.2 Add the read methods and events to `DiveLogService`, `PostService`, `SiteCatalogService` and `SiteModerationService`, and `AchievementService` and its listener (design D2, D3). Add `AchievementAwardIT` covering every scenario of "Achievements are awarded on relevant actions", "An award is permanent and made once" and "A failed evaluation does not refuse the action"; verify it, the existing dive log, post and moderation tests, and `LayeredArchitectureTest` pass.
- [x] 1.3 Add the controller (design D4). Add `AchievementApiIT` covering every scenario of "The API reports achievements and progress"; verify it passes.
- [x] 1.4 Add `en` and `uk` strings for the eight achievements, and extend `ReferenceDataLocaleIT` to cover "Every achievement has both languages"; verify it passes.
- [x] 1.5 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Front-end

- [x] 2.1 Add `features/achievement/api.ts` and `ProfileAchievements`, in `ProfilePage`, with `en` and `uk` strings, and default MSW handlers. Add Vitest tests covering the `user/profile` delta; verify they and the existing profile tests pass.
- [x] 2.2 Add `UnlockedBanner`, in `DiveLogPage` and `DiveForm`, with `en` and `uk` strings. Add Vitest tests covering the `divelog/log-page` delta; verify they and the existing dive log tests pass.

## 3. Integration

- [x] 3.1 Update `docs/ARCHITECTURE.md` (existing tables, the progress privacy rule); verify against design D1 and D4.
- [x] 3.2 On the running stack, in a browser at 1280 px and 375 px, in `en` and `uk` and both themes, with real clicks: log a first dive and see the banner, see earned and locked cards on the profile, publish a post, have the demo admin approve a submitted site, and view the profile as an anonymous visitor with statistics hidden. Fix any gaps; verify with screenshots.
- [x] 3.3 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [x] 3.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/add-achievements/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-achievements` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
