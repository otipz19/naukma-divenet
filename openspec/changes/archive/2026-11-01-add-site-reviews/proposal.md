# Proposal

## Why

Divers can find and read about sites, but cannot learn from each other: there are no reviews,
no ratings and no community view of how hard a site really is. Reviews are the core social
feature of M2, and the map's minimum-rating filter and rating sort (moved here by
`add-site-search-and-filters`) wait for rating data. Media uploads and the photo field are now
built, so reviews can carry photos.

## What Changes

- New `review` back-end feature: a `reviews` table (one review per user per site) with an
  optional 1–5 rating, an optional 1–5 difficulty rating, optional text up to 4000 characters
  and up to 6 photos in `review_media`. A review must have a rating or text.
- REST endpoints: list a site's reviews (paged, newest first or highest rated first), read
  the signed-in user's own review of a site, create, edit and delete a review. Only the
  author edits or deletes; only approved sites take reviews. Photos are attached and released
  through `MediaService`.
- Site aggregates: average rating, rating count, review count and community difficulty, kept
  on the site row and recomputed in the same transaction as every review write.
- Site endpoints gain the aggregates: `GET /api/v1/sites/{id}` and `GET /api/v1/sites/markers`
  return them. The markers endpoint gains `minRating` and `sort=name|rating`.
- Site page: the facts card shows the Rating and the community difficulty; a "Write a review"
  (or "Edit your review") button; a Reviews section with author, date, rating, text and photo
  thumbnails, a sort select, "Load more", and Edit/Delete on the user's own review.
- Review form page at `/sites/:id/review` (signed in) following `design/screens/ReviewForm.html`:
  rating input with "No rating", community difficulty chips, text, and the existing photo field.
  The same page edits an existing review.
- Map page: a "Min rating" select and a sort select (rating or name) kept in the URL; site
  cards show the Rating.
- A shared `Rating` component (display and input) following `design/system/components/Rating`.
- en and uk strings for all of it.

Stories: **US-03** (read reviews), **US-04** (rate and review), **US-05** (minimum-rating
criterion).

Out of scope or deferred:
- Review moderation and admin deletion of reviews (not in any story; can be added with a
  later moderation item).
- Linking a review's author to their profile and showing their verified certificate badge:
  profiles and certificates do not exist yet. Notes for `add-diver-profile` and
  `add-certificates` record this.
- Demo reviews: `complete-demo-seed` already covers them.
- Video in reviews (`add-video-media`, stretch).

No departure from `docs/ARCHITECTURE.md`: `review` depends on `site`, `user` and `media`
through their services and entities; `site` does not depend on `review`.

## Capabilities

### New Capabilities

- `review/reviews`: the review API: create, read, list, edit and delete, validation, one review
  per user per site, ownership, photos.
- `review/ratings`: how a site's average rating, rating count, review count and community
  difficulty follow its reviews.
- `review/site-reviews`: the Reviews section of the site page, with the own review's edit and
  delete.
- `review/review-form`: the page that writes and edits a review.
- `shared/rating`: the Rating component, display and input.

### Modified Capabilities

- `site/catalog`: markers and site details carry the rating aggregates; markers can be ordered
  by rating.
- `site/search`: `minRating` and `sort` on the markers endpoint; the map page's "Min rating" and
  sort selects, kept in the URL; site cards show the rating.
- `site/details`: the facts card shows the rating and community difficulty; the page offers
  "Write a review" or "Edit your review".

## Plan updates absorbed

None. `docs/plan-updates/add-site-reviews/` has no notes; the rating filter move from
`add-site-search-and-filters` was already applied to this item's roadmap row.

Notes written by this change (committed with the proposal):
- `docs/plan-updates/add-diver-profile/add-site-reviews--review-author-link.md` (add-scope):
  link review author names on the site page to the profile.
- `docs/plan-updates/add-certificates/add-site-reviews--review-author-badge.md` (add-scope):
  show the verified certificate badge next to the review author, as `Site.html` does.

## Impact

- Back-end: new package `ua.ukma.divenet.review` (web, service, domain); `site` gains aggregate
  columns, the `minRating` filter and the rating sort, and a service method `review` calls to
  store aggregates; Flyway `V9__create_reviews.sql`.
- API: new review endpoints; new fields on `SiteResponse` and `SiteMarkerResponse`; new
  optional markers parameters. `api/openapi.json` and `frontend/src/api/schema.gen.ts`
  regenerated. Additive only.
- Front-end: `src/features/review/` (reviews section, form page, routes), `src/components/Rating/`,
  changes to `SitePage`, `MapPage`, `SearchFilters`, `siteSearch.ts`, `SiteCard`; en/uk locale keys.
- Docs: ARCHITECTURE.md data-model sentence and diagram (`reviews`, `review_media` exist),
  ROADMAP.md status.
