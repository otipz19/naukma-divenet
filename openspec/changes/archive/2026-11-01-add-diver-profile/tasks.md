# Tasks

## 1. Back-end

- [x] 1.1 Add `V11__add_user_profile.sql` and the fields on `User` (design D1); verify with `DatabaseBaselineIT` and the `ddl-auto=validate` startup.
- [x] 1.2 Add `ProfileService` and `ProfileController` (design D2, D3). Add `ProfileApiIT` covering every server scenario of spec `user/profile`; verify it and `LayeredArchitectureTest` pass.
- [x] 1.3 Add `avatarUrl` to a review's author (design D4). Cover "API field" and its null case in the review API tests; verify they pass.
- [x] 1.4 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Shared front-end

- [x] 2.1 Add `components/Avatar`, and widen `Alert`'s `title` (design D5). Add Vitest tests for the image and initials cases and a linked title; verify they and the existing `Alert` tests pass.

## 3. Profile pages

- [x] 3.1 Add `ProfilePage` with `en` and `uk` strings, and the account menu and drawer links. Add Vitest tests with MSW covering "Profile renders", "No avatar or bio", both failure scenarios, "Owner", "Other visitor" and "Account menu"; verify they pass.
- [x] 3.2 Add `ProfileEditPage` with its schema and `en` and `uk` strings. Add Vitest tests with MSW covering every edit page scenario; verify they pass.

## 4. Author links

- [x] 4.1 Link the author and use `Avatar` in `ReviewCard`. Add Vitest tests covering "Author with an avatar" and "Author without an avatar"; verify they and the existing review tests pass.
- [x] 4.2 Link the author in `WarningAlert`. Add a Vitest test covering "Warning shown"; verify it and the existing warning tests pass.

## 5. Integration

- [x] 5.1 Update `docs/ARCHITECTURE.md` (the existing tables, and `users` to `media` in the ER diagram); verify against design D1.
- [x] 5.2 On the running stack, in a browser at 1280 px and 375 px, in `en` and `uk` and both themes: register a test user, upload an avatar through the form, save a bio and a privacy setting, reload, replace the avatar, and follow a review author's link. Fix any gaps; verify with screenshots.
- [x] 5.3 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [x] 5.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/add-diver-profile/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-diver-profile` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
