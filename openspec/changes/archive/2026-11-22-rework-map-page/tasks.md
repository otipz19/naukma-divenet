# Tasks

## 1. Start

- [x] 1.1 Set `rework-map-page` to `in-progress` in `docs/ROADMAP.md`.
- [x] 1.2 Set F-03, F-10, F-11 and F-12 to `taken: rework-map-page` in `docs/review-findings/`, both in the index and in each finding's file.

## 2. Design files

- [x] 2.1 Update `design/screens/Map.html` (D10):
  - the side panel with a fixed head: search, the collapsed "Filters · 2" toggle, the active-filter chips and the count;
  - the list scrolling below the head;
  - "Add a site" in the map's top-right corner;
  - no disclaimer strip;
  - a second frame with the filters expanded, and a frame with the first-visit disclaimer dialog.

  Verify: the screens render in `node design/serve.mjs`.
- [x] 2.2 Update `design/screens/MobileMap.html`:
  - remove the disclaimer caption;
  - add a frame with the filters dialog ("Clear all" and "Show N sites");
  - add a frame with the results sheet expanded;
  - show "Add a site" above the sheet.

  Verify: the screens render in `node design/serve.mjs`.
- [x] 2.3 Delete `design/system/components/AppFooter/` and the `.dn-footer` rules in `components/bundle.css`. Update `docs/DESIGN.md`:
  - the component list;
  - the `Map.html` and `MobileMap.html` rows of the screen table;
  - rule 8: a first-visit dialog that can be dismissed, plus the site page's box that cannot;
  - rule 9: the map fills the viewport, the filters and the results sheet on phones.

  In `docs/ARCHITECTURE.md`, replace the `AppFooter` example in the folder map. Verify: `node design/build-tokens.mjs --check` passes.

## 3. Shell and disclaimer

- [x] 3.1 Remove `components/AppFooter` and its tests, and drop it from `app/AppLayout.tsx`. Make the layout a `100dvh` column, with a `100vh` fallback, in which `main` can hold a full-height page (D2). Update `router.test.tsx`: one banner, one main and no contentinfo landmark on `/` and on `/no-such-page`. Update `LanguageSwitch.test.tsx` so it no longer looks in the footer; it checks the header text in `uk` instead.
- [x] 3.2 Build `features/disclaimer/DisclaimerDialog.tsx` and its storage helpers (`readDismissed` and `saveDismissed`, both inside `try`), and render it in `AppLayout` (D1). Add Vitest tests for each `shared/disclaimer` scenario jsdom can reach:
  - first visit;
  - any page;
  - `uk` text;
  - not again after a route change;
  - closed with the box unchecked: remount and it shows again;
  - "Don't show again": remount and it does not show;
  - Escape, with focus on `main`;
  - storage throws.
- [x] 3.3 Add the `en` and `uk` strings `shell.disclaimer.*` (`title`, `safetyLead`, `disclaimer`, `project`, `dontShowAgain` and `gotIt`), and remove `shell.footer.*` (D9). Verify: the i18n parity step and `tsc` pass.

## 4. Map page

- [x] 4.1 Add `useMediaQuery` in `features/site/`, with a unit test that it follows a `matchMedia` change (D3).
- [x] 4.2 Add `activeFilterChips(search, t)` to `siteSearch.ts` (D5). Unit-test it in `siteSearch.test.ts`:
  - the order and labels for every kind of filter;
  - `without` clears only its own value;
  - the count equals `activeFilters()`.
- [x] 4.3 Rework the desktop panel in `MapPage.tsx` and `MapPage.module.css` (D4):
  - the fixed head: search, Filters toggle, chips and count;
  - the scrolling body: the filters when expanded, then the results;
  - the filters collapsed by default at every width;
  - the page fills the height from D2;
  - remove the footer margin hack, the "Show list" toggle and `.closedOnNarrow`.

  Update `MapPage.test.tsx` with tests for "Collapsed on open", "Toggles report their state", "Chips for active filters" and "Remove one". The scroll scenario "Count fixed while the list scrolls" is checked in E2E (task 5.2).
- [x] 4.4 Add the floating "Add a site" link in the map section and remove the panel link (D7). Add `MapPage.test.tsx` tests for "Link on the map" (it is inside the map region and not inside the search panel) and "In Ukrainian". Update the `site/submission` scenario test "Link from the map" if it looks for the old label.
- [x] 4.5 Build the phone layout (D6):
  - the floating top bar;
  - the filters `Dialog` with "Clear all" and "Show N sites";
  - the results sheet with peek and expanded states;
  - the zoom control below the measured top bar.

  Add phone-layout `MapPage.test.tsx` tests, with a `matchMedia` that matches `(max-width: 1099px)`, for "Filters dialog" (named, changes apply at once, closes and returns focus) and "Results sheet peek and expand".
- [x] 4.6 Add the `en` and `uk` strings:
  - `site.map.addSite`;
  - `site.search.removeFilter`;
  - `site.search.chip.minDepth`, `.maxDepth` and `.minRating`;
  - `site.search.showSites`, with Ukrainian plurals;
  - `site.search.sheetExpand` and `.sheetCollapse`.

  Remove `site.search.showList`, `site.search.hideList` and `site.submit.link`. Verify: the i18n parity step, `tsc` and ESLint (no hard-coded JSX text) pass.
- [x] 4.7 Check that `SitePage.test.tsx` still covers the disclaimer box, and add the scenario "Shown after the dialog was dismissed": with storage set to `dismissed`, the site page still has the alert. Remove the footer wording from the test names.

## 5. End-to-end, accessibility and performance

- [x] 5.1 Add the D8 fixture to `e2e/src/support/index.ts`: a `test` whose context pre-sets `divenet.disclaimer`, and `dismissDisclaimer(context)` for contexts a spec builds itself. Switch every journey to it. Verify: `pnpm test:e2e` passes all of the existing journeys.
- [x] 5.2 In `anonymous-browse.spec.ts`, add a first-visit journey on a plain context:
  - the dialog is shown;
  - Escape closes it, and focus is on `main`;
  - after a reload it is shown again;
  - "Don't show again" plus "Got it", then a reload, shows no dialog.

  Add the `site/map` height checks at 1440×900 and 390×844 (scroll height equals viewport height), and the "Count fixed while the list scrolls" check at 1440×900.
- [x] 5.3 In `audit-accessibility.spec.ts`:
  - scan `/` with the disclaimer dialog open in the light theme, the dark theme and `uk`;
  - on a 390×844 context, scan `/` with the sheet expanded and with the filters dialog open.

  Verify: the audit passes with no new accepted exception.
- [x] 5.4 Run `pnpm test:perf`. The first Lighthouse visit now opens the dialog. Confirm that every budget still holds, without changing a budget. If one fails, find the cause and fix it, and record the cause in the PR.
- [x] 5.5 Check by hand on the running stack at 1440×900, 1280×800 and 390×844, in both themes and in `uk`:
  - the page does not scroll;
  - the count stays in view;
  - "Add a site" does not cover Leaflet's controls or attribution;
  - the sheet and the filters dialog work.

  Take screenshots for the PR.

## 6. Finish

- [x] 6.1 Set F-03, F-10, F-11 and F-12 to `done: rework-map-page` in `docs/review-findings/` in the archive commit.
- [x] 6.2 Run `pnpm check` from the repository root, and fix any failures without weakening a check.
- [x] 6.3 Update `docs/ROADMAP.md` (the status of `rework-map-page`) and `docs/HANDOFF.yaml`.

## Workflow follow-up

The rest happens on `change/rework-map-page`:

1. Sync the delta specs into `openspec/specs/`.
2. Run `openspec validate --all --strict`.
3. Archive.
4. Push the branch, and open the PR to `master`.

Never archive after the merge.
