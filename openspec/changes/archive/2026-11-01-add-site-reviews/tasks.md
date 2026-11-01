# Tasks

## 1. Schema and site aggregates

- [x] 1.1 Add `V9__create_reviews.sql` (design D1), the `review.domain` entities `Review` and `ReviewMedia` with `ReviewRepository`, and the aggregate fields on `Site`. Add `ReviewRepositoryIT` checking the rating and difficulty ranges, the rating-or-text CHECK, `UNIQUE (site_id, author_id)` and `UNIQUE (media_id)`; verify it passes.
- [x] 1.2 Add `SiteCatalogService.lockForReview` and `updateReviewAggregates` with the `ReviewAggregates` record (design D2), and the aggregate fields on `SiteMarkerView`, `SiteView`, `SiteMarkerResponse` and `SiteResponse`. Extend `SiteApiIT` with "Markers carry the rating" and "Site details carry the review aggregates" on rows set through the service; verify it and `LayeredArchitectureTest` pass, and that `site` has no import from `review`.
- [x] 1.3 Add `minRating` and `sort` to `SiteFilter`, `SiteSearch` and `SiteController.markers` (design D4). Extend `SiteSearchApiIT` with "Minimum rating", "Invalid minimum rating", "Highest rated first" and "Unknown sort", and keep "Markers are ordered by name" passing; verify it passes.

## 2. Review API

- [x] 2.1 Add `ReviewService.create`, `list`, `mine`, the exceptions (409 duplicate, 403 not author, 404 via `SiteNotFoundException`) and `ReviewController` for the GET and POST endpoints, plus the `reviews/mine` security rule (design D3, D4). Add `ReviewApiIT` covering every scenario of "Signed-in users review an approved site", "A review has a rating or text", "A user reviews a site once", "Everyone reads a site's reviews" and "Users read their own review of a site"; verify it passes.
- [x] 2.2 Add photo handling on create through `MediaService.attach`, with the `photoIds` field violation (design D4, D5). Extend `ReviewApiIT` with "Too many photos", "Another user's upload" (upload stays unattached) and "Photos keep their order"; verify it passes.
- [x] 2.3 Add `ReviewService.update` and `delete` and the PUT and DELETE endpoints, with the photo diff and release (design D5). Extend `ReviewApiIT` with every scenario of "Authors edit their review" and "Authors delete their review"; verify it passes.
- [x] 2.4 Recompute aggregates on every write (design D2). Add `ReviewAggregatesIT` covering every scenario of `review/ratings`, including "Concurrent reviews" with ten threads; verify it passes.
- [x] 2.5 Regenerate `api/openapi.json` (`ApiContractTest -Dopenapi.update=true`) and `frontend/src/api/schema.gen.ts` (`api:types`); verify `ApiContractTest` and `api:types:check` pass and the generated types make the always-present fields required.

## 3. Rating component

- [x] 3.1 Add `components/Rating` (`Rating` and `RatingInput`) with a tokens-only CSS module and the `rating.*` strings in `en` and `uk`, following `design/system/components/Rating` (design D7, D8). Add `Rating.test.tsx` covering every scenario of `shared/rating`; verify it passes.

## 4. Map and site page

- [x] 4.1 Show the Rating in `SiteCard` (remove the "without Rating" note). Add `SiteCard.test.tsx` covering "Rated site" and "Unrated site"; verify it passes.
- [x] 4.2 Add `minRating` and `sort` to `siteSearch.ts`, the "Min rating" and sort selects to `SearchFilters`/`MapPage`, and the `site.search.*` strings in `en` and `uk` (design D7). Extend `siteSearch.test.ts` and `MapPage.test.tsx` with "Minimum rating chosen", "Sorting", "Opening a URL with rating and sort", "Hand-edited rating" and the existing "Clear all" clearing the minimum rating; verify they pass.
- [x] 4.3 Show the rating and community difficulty in the `SitePage` facts card and the "Write a review"/"Edit your review" link, with the `site.details.*` strings in `en` and `uk`. Extend `SitePage.test.tsx` with every scenario of "The facts card shows the community view" and "The site page offers to write or edit a review"; verify it passes.

## 5. Reviews section and form

- [x] 5.1 Add `features/review/api.ts`, `SiteReviews` and `ReviewCard`, rendered by `SitePage` for approved sites, with the `review.*` section strings in `en` and `uk` (design D7). Add `SiteReviews.test.tsx` (MSW) covering every scenario of `review/site-reviews`; verify it passes.
- [x] 5.2 Add `ReviewFormPage` at `sites/:id/review` behind `RequireAuth`, with `reviewSchema.ts`, `RatingInput`, difficulty chips, the text area and `PhotoField` (max 6), and the `review.form.*` strings in `en` and `uk` (design D6, D7). Add `ReviewFormPage.test.tsx` (MSW) covering every scenario of `review/review-form`; verify it passes.
- [x] 5.3 Run the front-end dev server against the local API, in both languages and both themes, at desktop and phone width: write, edit and delete a review with photos, and filter and sort the map by rating. Compare with `design/screens/Site.html`, `ReviewForm.html` and `Map.html`, fix any gaps and verify with screenshots.

## 6. Docs, plan updates and integration

- [x] 6.1 Update `docs/ARCHITECTURE.md`: `reviews` and `review_media` in the existing-tables sentence, and `minRating` and `sort` in the markers paragraph; verify the ER diagram still matches `V9__create_reviews.sql`.
- [x] 6.2 Check that the plan-update notes written at proposal time (`docs/plan-updates/add-diver-profile/add-site-reviews--review-author-link.md`, `docs/plan-updates/add-certificates/add-site-reviews--review-author-badge.md`) still match what was built (field names, file paths); verify `node scripts/check-plan-updates.mjs` passes.
- [x] 6.3 Run `pnpm check` from the repository root and confirm it exits 0.
- [x] 6.4 Update the `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` and validate with `openspec validate --all --strict`.
- Archive on `change/add-site-reviews` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
