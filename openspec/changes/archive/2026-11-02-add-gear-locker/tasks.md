# Tasks

## 1. Back-end

- [x] 1.1 Add `V17__create_locker_items.sql`, the `user.domain` entity and repository, `LockerService` and the controller (design D1, D3). Add `GearLockerApiIT` covering every scenario of spec `user/gear-locker`; verify it, `DatabaseBaselineIT` and `LayeredArchitectureTest` pass.
- [x] 1.2 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Front-end

- [x] 2.1 Add `ProfileGear` to `ProfilePage` with `en` and `uk` strings, and a default MSW handler (design D4). Add Vitest tests covering the `user/profile` delta; verify they and the existing profile tests pass.

## 3. Integration

- [x] 3.1 Update `docs/ARCHITECTURE.md` (existing tables, the ER diagram); verify against design D1.
- [x] 3.2 On the running stack, in a browser at 1280 px and 375 px, in `en` and `uk` and both themes, with real clicks: add items as a test user, remove one, and read the profile as an anonymous visitor. Fix any gaps; verify with screenshots.
- [x] 3.3 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [x] 3.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/add-gear-locker/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-gear-locker` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
