# Design

## Context

See proposal.md for motivation; the behaviour is in the delta specs. What exists:

- `site`: `Site` entity, `SiteCatalogService.markers(SiteFilter)` built on the criteria query in
  `SiteSearch` (ordered by name, region and country fetched), `SiteResponse` and
  `SiteMarkerResponse` records with `@Schema(requiredProperties)`. Unapproved sites answer 404
  except to author and admins (`Viewer`).
- `media`: `MediaService.attach(ids, userId)` (all or nothing, throws
  `MediaNotAttachableException` naming the refused id) and `release(ids)` (deletes rows, files
  after commit). Both join the caller's transaction. `MediaView` has `url()` and `thumbnailUrl()`.
- `SecurityConfig` permits every GET under `/api/v1/**` except an explicit list
  (`/api/v1/auth/me`, `/api/v1/sites/mine`) that requires authentication.
- Front-end: `SitePage`, `MapPage` with `SearchFilters` and `siteSearch.ts` (URL ↔ filters),
  `SiteCard` (rating left out with a comment pointing here), `PhotoField` (value of `MediaView`s,
  `max` prop), `RequireAuth`, `DifficultyBadge` with `difficultyWord(1..5)` and `levelsOf(word)`.

## Goals / Non-Goals

**Goals:**

- `site` stays independent of `review`: the dependency points `review → site` only.
- Filtering and sorting markers by rating stays one SQL query with no join to reviews.
- Aggregates are never stale after a review write commits, including under concurrent writes.

**Non-Goals:**

- Admin moderation of reviews, review reporting, helpful votes, replies.
- Showing review photos in the site's photo gallery (the site page has no gallery yet).

## Decisions

### D1: Schema (`V9__create_reviews.sql`)

```sql
reviews (
  id bigserial PK,
  site_id bigint NOT NULL REFERENCES sites (id),
  author_id bigint NOT NULL REFERENCES users (id),
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  difficulty smallint CHECK (difficulty BETWEEN 1 AND 5),
  text varchar(4000),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (site_id, author_id),
  CHECK (rating IS NOT NULL OR text IS NOT NULL)
)
INDEX reviews_site_created (site_id, created_at DESC)
review_media (
  review_id bigint NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media (id),
  position smallint NOT NULL,
  PRIMARY KEY (review_id, media_id),
  UNIQUE (media_id)
)
ALTER TABLE sites ADD
  rating_average numeric(2,1),        -- null when no ratings
  rating_count integer NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  community_difficulty numeric(2,1);  -- null when no difficulty ratings
INDEX sites_rating_average (rating_average DESC NULLS LAST)
```

Review ids are `bigserial`: reviews are public, so guessable ids reveal nothing. Blank text is
stored as `NULL`, so the CHECK enforces "rating or text" in the database too. `media_id` is
unique because an upload belongs to one piece of content.

### D2: Aggregates are denormalised onto `sites`, written by `review` through `site`'s service

`ReviewService` calls `SiteCatalogService.lockForReview(siteId)` at the start of every write.
It returns the approved site locked with `PESSIMISTIC_WRITE` (`SELECT ... FOR UPDATE`), or
throws `SiteNotFoundException`. After the write, `ReviewService` computes the aggregates with one
`avg/count` query over the site's reviews and passes them to
`SiteCatalogService.updateReviewAggregates(siteId, ReviewAggregates)`. The rounding to one
decimal happens in SQL (`round(avg(rating), 1)`).

Alternatives: computing aggregates in the markers query (a join or subquery on `reviews` from
`SiteSearch`) would make `site` depend on `review` and put a GROUP BY into every map load;
a database view has the same dependency in SQL. Incrementing counters instead of recomputing
drifts if a bug ever skips one path; recomputing per write is cheap at one site's review count.
The row lock serialises concurrent writes to one site, which keeps counts exact (spec
`review/ratings`, "Concurrent reviews") and also serialises the uniqueness check.

### D3: One review per user per site

Enforced by `UNIQUE (site_id, author_id)`. The service checks first and throws
`ReviewAlreadyExistsException` (409); the lock from D2 means the check cannot race, and the
constraint remains the backstop. The UI never offers a second review: the site page reads
`reviews/mine` and switches the button to "Edit your review". Alternative considered: many
reviews per user (a review per visit). Rejected: one user would weigh several times in the
average, and the dive log (`add-dive-log`) is the place for per-visit records.

### D4: Endpoints

| Method | Path | Auth | Result |
| --- | --- | --- | --- |
| GET | `/api/v1/sites/{siteId}/reviews?page&size&sort=newest\|rating` | anonymous | `PagedModel<ReviewResponse>` |
| GET | `/api/v1/sites/{siteId}/reviews/mine` | signed in | `ReviewResponse` or 404 |
| POST | `/api/v1/sites/{siteId}/reviews` | signed in | 201 `ReviewResponse`, `Location: /api/v1/reviews/{id}` |
| PUT | `/api/v1/reviews/{id}` | author | 200 `ReviewResponse` |
| DELETE | `/api/v1/reviews/{id}` | author | 204 |

Changed: `GET /api/v1/sites/markers` gains `minRating` (`@DecimalMin("1") @DecimalMax("5")`)
and `sort` (enum `MarkerSort { NAME, RATING }`, bound case-insensitively from `name`/`rating`;
an unknown value gives 400 through the existing type-mismatch handling). `SiteMarkerResponse`
gains `averageRating` (nullable) and `ratingCount`; `SiteResponse` also gains `reviewCount` and
`communityDifficulty` (nullable). All additions, so existing clients keep working.

`ReviewResponse`: `id`, `siteId`, `author { id, displayName }`, `rating?`, `difficulty?`, `text?`,
`photos: [{ id, url, thumbnailUrl, width, height }]`, `createdAt`, `updatedAt`.
`ReviewRequest`: `rating?` (1–5), `difficulty?` (1–5), `text?` (`@Size(max = 4000)`),
`photoIds?` (`@Size(max = 6)`, UUIDs). The "rating or text" rule runs in the service after
stripping and throws a field violation on `text`, so its 400 has the usual `errors` shape.

`SecurityConfig` adds `GET /api/v1/sites/*/reviews/mine` to the authenticated list; the other
writes are authenticated by the existing catch-all. `MediaNotAttachableException` from `attach`
is translated by `ReviewService` into a field violation on `photoIds` (400), since the review
API names fields.

Review sort `rating`: `ORDER BY rating DESC NULLS LAST, created_at DESC`. Marker sort `rating`:
`ORDER BY rating_average DESC NULLS LAST, name ASC`, added in `SiteSearch` (Hibernate's criteria
builder supports null precedence).

### D5: Editing photos

On PUT, the service diffs the review's current media ids with the request's: ids no longer
present are removed from `review_media` and passed to `MediaService.release`; new ids are passed
to `MediaService.attach`; kept ids are untouched. `review_media` is rewritten with the request's
order as `position`. A kept id is recognised by being in the review's current set, so `attach`
never sees it (it would refuse it as already attached). DELETE releases every photo of the
review before deleting the row.

### D6: Difficulty scale and the form's four chips

Reviews store difficulty on the site's 1–5 scale, so `communityDifficulty` compares directly
with the declared difficulty and the site page shows both through `difficultyWord`. The design
has four word chips, so a chip sends the lowest level of its word (`levelsOf(word)[0]`:
beginner 1, intermediate 2, advanced 4, technical 5), and an edited review shows the chip of
`difficultyWord(stored)`. Alternative: a 1–4 scale for reviews. Rejected: two scales for one
fact, and the average could not be shown with the existing words. Trade-off: "intermediate" pulls
the average towards 2 rather than 2.5; the word shown is the same either way.

### D7: Front-end structure

- `src/components/Rating/`: `Rating` (display: `value?`, `count?`) and `RatingInput`
  (radio group, React Hook Form controlled). Stars are inline SVG, CSS from tokens (`--rating`,
  `--border-strong`).
- `src/features/review/`: `SiteReviews` (section on the site page; `useInfiniteQuery` over pages,
  sort in component state), `ReviewCard`, `ReviewFormPage` (route `sites/:id/review` in
  `reviewRoutes`, wrapped in `RequireAuth`), `reviewSchema.ts` (Zod), `api.ts` (typed calls and
  query keys).
- `SitePage` renders `SiteReviews` and the review button only for `status === "APPROVED"`; it
  reads `reviews/mine` when signed in to pick the button label (a 404 means none).
- Query keys: `["sites", id, ...]` for the site, `["reviews", siteId, sort]` and
  `["reviews", siteId, "mine"]`. A successful create, edit or delete invalidates `["sites"]` and
  `["reviews", siteId]`, so aggregates and markers refresh.
- Delete confirmation is an inline confirm/cancel pair inside the card, not `window.confirm`, so
  it is testable, translatable and styled.
- Map: `siteSearch.ts` gains `minRating` (`""`, `"3"`, `"4"`, `"4.5"`; anything else read from
  the URL is ignored) and `sort` (`"rating"` default, omitted from the URL; `"name"`). The markers
  request always sends `sort`. The result list uses the server's order.

### D8: i18n namespaces

New: `review.*` (section, card, form, errors), `rating.*` (labels, "No ratings yet", "1 star"…).
Extended: `site.details.*` (community difficulty, write/edit review), `site.search.*` (min rating
options, sort options). All keys in `en` and `uk`.

## Risks / Trade-offs

- [Row lock per review write] → Writes to one site serialise. At this project's traffic that is
  invisible, and it is what keeps counts exact.
- [Denormalised aggregates can drift if a write path forgets the update] → All writes go through
  `ReviewService`, which recomputes from scratch; an integration test per write path checks the
  aggregates (spec `review/ratings`).
- [Deleting a user or a site with reviews] → No such flow exists yet; the foreign keys refuse it,
  which is the safe default until one does.
- [Author display name only] → No profile link or certificate badge until those items exist;
  plan-update notes record the follow-up.

## Migration Plan

Forward-only `V9`: new tables and nullable or defaulted columns on `sites`, so existing rows are
valid (no reviews: count 0, averages null). The API changes are additive. Rollback is reverting
the PR on a fresh database; there is no production data.
