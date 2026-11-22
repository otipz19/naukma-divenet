## 1. Phone map controls under the drawer (F-20)

- [x] 1.1 Add `isolation: isolate` to `.phone` in `features/site/MapPage.module.css` (design D1)
- [x] 1.2 E2E test in `e2e/src`: on a 390 px viewport open the navigation drawer on `/` and assert the element at the search box centre is inside the drawer (scenario "Drawer covers the map controls")

## 2. Desktop filters open in place (F-21)

- [x] 2.1 `SearchFilters`: optional `onHide` prop that shows a "Hide filters" button in the head row; add `site.search.hideFilters` to `en` ("Hide filters") and `uk` ("Сховати фільтри")
- [x] 2.2 `MapPage` desktop head: search box, count, then the Filters button with chips or the filters form (moved out of the scrolling body); cap the head height with its own scroll (design D2, D3)
- [x] 2.3 Focus: opening focuses the filters group named "Filters"; "Hide filters" returns focus to the Filters button (design D4)
- [x] 2.4 Vitest in `MapPage.test.tsx`: update "starts collapsed" and "reports the count…", add "opens in place of the button", "hide filters returns focus to the button", "count comes before the Filters button"; update "keeps the count in the panel head…" for the new order

## 3. No chips on a phone (F-22)

- [x] 3.1 Render the removable chips only in the desktop toolbar while the form is closed (design D5)
- [x] 3.2 Vitest: "no chips while the form is open" (desktop) and "no chips on a phone, count in the Filters label" (390 px); keep "shows a chip per active filter…" and "removes only its own filter" on a desktop viewport

## 4. Toasts stay 10 s (F-23)

- [x] 4.1 Set `TOAST_MS = 10000` in `components/Toast/Toast.tsx`
- [x] 4.2 Vitest in `Toast.test.tsx`: rename the timing tests to 10 seconds and add "still shown after 9 seconds"

## 5. Dive log header over the actions (F-24)

- [x] 5.1 `DiveTable.tsx`: keep the actions `<th>` in the row, hide only its text in a visually-hidden span (design D7)
- [x] 5.2 Vitest in `DiveLogPage.test.tsx`: header row has as many cells as a dive row, last one a column header named "Actions" (scenario "Header cell over the actions")

## 6. Design and docs

- [x] 6.1 Update `design/screens/Map.html` (panel order: search, count, Filters or the open form with "Hide filters"), `design/system/components/Chip/README.md` (removable chips: desktop only, form closed), `design/system/components/Toast/README.md` (about 10 seconds) and the Map row in `docs/DESIGN.md`
- [x] 6.2 Set F-20 to F-24 to `done: polish-second-review` in `docs/review-findings` (README index and each file)

## 7. Gate and handoff

- [x] 7.1 Run `pnpm check` and fix any failure
- [x] 7.2 Set the roadmap status to `in-progress` at apply and update `docs/HANDOFF.yaml`
- [x] 7.3 Workflow follow-up: sync the delta specs into `openspec/specs/`, archive on this branch (roadmap `archived` in the same commit), then push and open the PR; E2E runs in CI
