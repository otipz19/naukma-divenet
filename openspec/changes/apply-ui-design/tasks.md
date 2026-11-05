# Tasks

## 0. Plan updates

- [x] 0.1 Absorb `docs/plan-updates/apply-ui-design/add-site-warnings--no-warnings-moderation-tab.md` (the Warnings tab is an accepted difference), and delete the note; done with this proposal.

## 1. Known gaps

- [ ] 1.1 Add the `touch-target` token, regenerate `tokens.css`, and apply it in the Button and Chip modules and the map's zoom control (design D2). Add a Vitest test that reads the two CSS modules and the tokens for the `shared/app-shell` delta; verify it, the token check and the tokens-only CSS check pass.
- [ ] 1.2 Add the filter count to the phone Filters toggle, with `en` and `uk` strings. Add Vitest tests for the `site/search` delta; verify they and the existing map tests pass.
- [ ] 1.3 Add the header Log a dive button (design D3). Add a Vitest test for the `divelog/log-page` delta; verify it and the existing dive log tests pass.
- [ ] 1.4 Move the statistics into the profile header (design D3). Add Vitest tests for the `user/profile` delta; verify they and the existing profile and dive log tests pass.
- [ ] 1.5 Give the post editor's title the display type, add Cancel to the submission page, and give the site page's disclaimer box its own string. Add Vitest tests for the `post/editor`, `site/submission` and `site/details` deltas; verify they and the existing tests pass.

## 2. Audit

- [ ] 2.1 On the running stack, with demo data and a test user who has dives, a certificate, a review, a warning, a post, a draft and a pending site, audit every screen of `design/screens/` against its page in light and dark, at 1280 px and 375 px, in `en` and `uk`. Record each finding in `audit.md` (design D1).
- [ ] 2.2 Fix each visual finding in its CSS module or component, tokens only, and mark it fixed. For any finding that needs behaviour no story asks for, write a plan-update note for the item that owns it, and mark it accepted. Verify each fix with a screenshot at the width and theme where it was found.
- [ ] 2.3 Add the "Accepted differences" section to `docs/DESIGN.md` (design D4).

## 3. Integration

- [ ] 3.1 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [ ] 3.2 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/apply-ui-design/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/apply-ui-design` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
