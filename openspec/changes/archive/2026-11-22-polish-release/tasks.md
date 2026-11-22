# Tasks

## 1. Start

- [x] 1.1 Run `openspec list --json` and confirm no other change has completed tasks. Set `polish-release` to `in-progress` in `docs/ROADMAP.md`. Set F-06 and F-08 to `taken` in `docs/review-findings`. Verify that `node scripts/check-plan-updates.mjs` passes.

## 2. Error page (D1)

- [x] 2.1 Add `src/app/routes/ErrorPage.tsx`:
  - It has translated heading and text, a "Reload page" button and a link to `/`.
  - It logs the error with `console.error` and never renders the error text.
  - Add `shell.error.{heading,text,reload,home}` in `en` and `uk`.
  - Verify with the i18n parity step.
- [x] 2.2 Wrap the layout's children in a pathless route with `errorElement: <ErrorPage />` in `src/app/router.tsx`, and export a test helper that adds children to it. Add `router.test.tsx` cases:
  - a crash shows the banner, the copy and the `/` link, and no "boom";
  - following the header Feed link shows the feed;
  - the copy shows in `uk`.

## 3. Loading placeholders (D2)

- [x] 3.1 Add the design spec for the new component:
  - `design/system/components/Skeleton/README.md` and a `dn-skeleton` rule in `bundle.css`;
  - list the component in `docs/DESIGN.md`.
  - Verify that `node design/build-tokens.mjs --check` passes.
- [x] 3.2 Add `components/Skeleton` (`Skeleton`, `PagePlaceholder` with `aria-busy` and a visually hidden `role="status"`) with a tokens-only CSS module and a reduced-motion rule. Add `shell.loading` in `en` and `uk`. Add `Skeleton.test.ts`, which checks the reduced-motion rule from the stylesheet, and a render test of `PagePlaceholder`.
- [x] 3.3 Add placeholders to the map results list and the site page. Extend `MapPage.test.tsx` and `SitePage.test.tsx`: while pending, the busy region and the status are shown; once loaded, the site name replaces them.
- [x] 3.4 Add placeholders to the feed and post pages. Extend `Feed.test.tsx` and `Post.test.tsx`: pending shows the placeholder, and a failed feed request shows the error and no placeholder.
- [x] 3.5 Add placeholders to the profile, dive log, certificates and moderation pages. Extend `ProfilePage.test.tsx`, `DiveLogPage.test.tsx`, `Certificates.test.tsx` and `ModerationPage.test.tsx` with a pending case.

## 4. Document titles (D3)

- [x] 4.1 Add `src/app/documentTitle.ts` with `useDocumentTitle`. Add `shell.title` and the missing `shell.pageTitle.*` keys in `en` and `uk`. Add a unit test: the title format, the bare "DiveNet" when no page is given, and an update on a language change.
- [x] 4.2 Call `useDocumentTitle` on every routed page:
  - the map, site, submit site, moderation and feed pages;
  - the post, post editor, profile, profile edit and certificates pages;
  - the dive log, review form and warning form pages;
  - the login, register and not-found pages, and the error page.
  - Data pages use the loaded name.
- [x] 4.3 Add router tests:
  - every route's title ends with " · DiveNet" and is not "DiveNet";
  - `/feed` is "Feed · DiveNet";
  - a loaded site shows its name;
  - `/no-such-page` has the not-found title;
  - `uk` on `/dive-log`.

## 5. Theme switch (D4, F-08)

- [x] 5.1 Rework `src/app/theme.ts`:
  - `ThemeChoice`;
  - `localStorage` key `divenet.theme`, where unknown values and errors read as `system`;
  - `startTheme()`, `setThemeChoice()`, `useThemeChoice()`.
  - Call `startTheme()` in `main.tsx`.
  - Update `theme.test.ts`: light and dark system; a change while open; a saved choice that beats the system and ignores its changes; an unknown value; back to system.
- [x] 5.2 Add `components/ThemeSwitch`, with Monitor, Sun and Moon icons, `aria-pressed` and a group label. Place it after the language switch in `AppHeader` and `NavDrawer`. Add `shell.theme.{label,system,light,dark}` in `en` and `uk`. Add tests:
  - System is pressed by default;
  - pressing Dark pins dark and survives a remount with the same storage;
  - pressing System follows the OS again;
  - names in `uk`;
  - in the drawer, pressing Dark keeps the drawer open.
- [x] 5.3 Extend the theme test in `e2e/src/audit-accessibility.spec.ts`: pressing Dark under a light OS gives `data-theme="dark"`, and so does a reload. It runs in CI.
- [x] 5.4 Update the docs for the switch:
  - `docs/DESIGN.md` rule 3 (Themes);
  - `design/system/README.md` (Themes);
  - `design/system/components/AppHeader/README.md` (order and drawer contents);
  - the theme bullet in `docs/ARCHITECTURE.md`;
  - the comment in `theme.ts`.
  - Verify that no file says "no manual toggle" (`grep -rn "manual toggle" docs design frontend/src`).

## 6. Empty-state audit (D5)

- [x] 6.1 Check the remaining lists named in D5:
  - the moderation Warnings tab;
  - the phone results sheet;
  - the site photo gallery;
  - the post chips;
  - the profile achievements.
  - Fix every gap with a translated message (`en` and `uk`), or leave out the section where the viewer cannot add, with one test per fix.
  - Write the final table to `openspec/changes/polish-release/audit.md`.
- [x] 6.2 Add tests for the shared rule's scenarios that are not covered yet:
  - a dive log with no dives shows its empty message (check `DiveLogPage.test.tsx`);
  - a stranger's profile with no posts has no posts section (check `ProfilePage.test.tsx`);
  - the feed empty message is absent while the feed is pending (`Feed.test.tsx`).

## 7. More seeded posts (D6, F-06)

- [x] 7.1 Change `DemoSeeder`:
  - create posts in one round-robin pass over the divers after the per-diver content;
  - add `Images.reuseCover`;
  - add an optional `cover` field to `SeedPost`, where `"reuse"` copies an existing post-cover picture.
  - Verify that the existing `DemoSeederIT` still passes before any data is added.
- [x] 7.2 Add about 35 published posts to `demo.json` (at least 45 published in all):
  - at least 3 each for James, Ingrid and Nomvula;
  - every diver has at least one published post;
  - at least 8 distinct sites and at least 5 regions;
  - text in each diver's language;
  - `cover: "reuse"` and `photos: 0`.
- [x] 7.3 Extend `DemoSeederIT`:
  - at least 45 published posts;
  - `GET /api/v1/posts` reports at least 3 total pages;
  - every diver has a published post;
  - at least 8 sites and 5 regions;
  - the first feed page has posts by at least 4 divers;
  - every published post still has a cover served by `GET /media/{id}`.
  - Verify with `backend/mvnw verify`.

## 8. Wrap-up

- [x] 8.1 Set F-06 and F-08 to `done` in `docs/review-findings` and its README index (F-01 was set to `declined` at propose). Verify that the README table matches the files.
- [x] 8.2 Run `pnpm check` from the repository root and verify it passes. If the local Feed test flake hits, run the later gate steps by hand.
- [x] 8.3 Set `polish-release` to `archived` at archive time, and update `docs/HANDOFF.yaml` (done, next, checks.last).

## Workflow follow-up

- Sync the delta specs (`shared/app-shell`, `shared/web-app`, `demo/seed`) into `openspec/specs/` and run `openspec validate --all --strict`.
- Archive on `change/polish-release`, then push and open the PR to `master`. Read the check, stack and e2e jobs there.
