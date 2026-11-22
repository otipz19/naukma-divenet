# Tasks

## 1. Role check and route guard

- [ ] 1.1 Add `useIsAdmin()` to `features/auth/useSession.ts` (D1) and switch `SiteWarnings` and `ProfilePage` to it; verify with a `useSession.test.tsx` case for loading, signed out, `USER` and `ADMIN`
- [ ] 1.2 Add the `diver` flag to `RequireAuth` (D2): an admin is replaced by `/admin/moderation`; verify with `RequireAuth.test.tsx` cases for admin (redirect, child not rendered), `USER` (child rendered) and signed out (login page)
- [ ] 1.3 Use `<RequireAuth diver>` on every diver route in `divelog`, `post`, `site`, `review`, `warning` and `user` `routes.tsx`; verify with `router.test.tsx` cases "Admin opens the dive log" (the dive log is not requested) and "Admin opens the post editor"
- [ ] 1.4 `ProfilePage` shows the not-found page for the admin's own id and skips the profile query (D3); verify with `ProfilePage.test.tsx` cases "Own profile" and "Another diver's profile" (no Edit profile link)

## 2. Navigation and account area

- [ ] 2.1 Give `NavItem` `audience` and `badge`, add the Moderation entry and mark Dive log `notAdmin` (D4); add `useNavItems()`; `AppLayout` passes the items through `AppHeader` to `NavLinks` and `NavDrawer`; verify with `router.test.tsx` cases "Admin navigation", "Diver navigation" and "No entry for the admin", plus the existing app-shell and drawer tests updated to the new props
- [ ] 2.2 Add `usePendingModerationCount(enabled)` in `features/site` with `enabled` options on `useSiteQueue` and `useCertificateQueue` (D5); `NavLinks` renders the `Badge` and the "N pending" accessible name when the count is above 0; verify with tests for "Navigation entry" (badge "3"), "Nothing pending", "Current page", "Count follows moderation" (approve on the moderation page, badge "2") and that a `USER` never requests `/api/v1/admin/*`
- [ ] 2.3 Remove the Moderation item from the account menu and the drawer, and render "Profile" only for a `USER` (D3, D4); verify with `AccountArea.test.tsx` cases "Admin account menu", "Admin drawer" and "Account menu" (site/moderation)
- [ ] 2.4 Add `shell.nav.moderation` and `shell.nav.pending` (plural forms) to `en` and `uk`, and remove `shell.account.moderation` (D7); verify that the i18n parity step passes

## 3. Hidden diver actions

- [ ] 3.1 `SitePage` hides "Log a dive here" and "Write a review", and `SiteWarnings` hides "Report a warning" and keeps Hide (D6); verify with `SitePage.test.tsx` and `SiteWarnings.test.tsx` cases "Site page for an admin" and "Site page for a diver"
- [ ] 3.2 `MapPage` hides "Add a site" for the admin; verify with a `MapPage.test.tsx` case "Map for an admin"
- [ ] 3.3 `FeedPage` hides "Write a post" and the drafts aside, and does not request drafts for the admin; verify with a `Feed.test.tsx` case "Feed for an admin"

## 4. E2E and docs

- [ ] 4.1 `e2e/src/admin-moderation.spec.ts` opens moderation from the header's Moderation entry instead of the account menu; verify it typechecks (`pnpm --filter @divenet/e2e exec tsc --noEmit` or the package's typecheck); the run itself happens in CI
- [ ] 4.2 Update `docs/review-findings`: F-18 records the owner's 2026-11-22 decision (front-end only; the API 403s dropped for the demo); F-18 and F-19 change to `taken: scope-admin-account` in their files and in the README index and grouping; verify by reading the index
- [ ] 4.3 Add the admin rule under "Domain decisions → Roles" in `docs/PRODUCT.md` (moderator only; enforced in the web app); verify the text matches the `auth` delta

## 5. Gate

- [ ] 5.1 Run `pnpm check` and record the result (the known local `Feed.test` timing flake is noted, not hidden)
- [ ] 5.2 Set `scope-admin-account` to `in-progress` in `docs/ROADMAP.md` while applying, then update `docs/HANDOFF.yaml`

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` (`auth`, `shared/app-shell`, `site/moderation`, `divelog/log-page`) and run `openspec validate --all --strict`.
- Archive on the same branch, set the roadmap row to `archived` and set F-18 and F-19 to `done: scope-admin-account`.
- Push the branch and open the PR to `master`; the E2E run in CI proves the header entry.
