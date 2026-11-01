# Design: add-achievements

## Context

`docs/ARCHITECTURE.md` already plans `achievement` as a consumer of `DiveLogged`, `PostPublished` and `SiteApproved`, through `@TransactionalEventListener`. No code publishes events yet. Achievement definitions are reference data, so they belong in a migration, with their translations in the locale files. `design/screens/Profile.html` draws the cards, and `design/screens/DiveLog.html` the banner.

## Goals / Non-Goals

Goals: US-10, and the achievements part of US-11.

Non-goals: notifications, review rules, backfill (see the proposal).

## Decisions

### D1. Data

`V16__create_achievements.sql`:

- `achievements`: `code` (primary key), `name` (English), `metric`, `target`, `position`, with the eight rows in the proposal.
- `user_achievements`: `user_id` (cascade), `achievement_code`, `earned_at`, primary key `(user_id, achievement_code)`.

`metric` is one of `DIVES`, `SITES`, `COUNTRIES`, `DEEPEST`, `PUBLISHED_POSTS`, `APPROVED_SITES`, an enum in the entity. The set of metrics is code and the targets are data, so a new rule on an existing metric is one migration.

### D2. Evaluate from live data, award once

A rule is not a counter. On each event the service reads the user's current numbers and inserts an award for each target met, with `INSERT ... ON CONFLICT DO NOTHING`, so concurrent requests cannot fail or award twice.

- Numbers come from the owning services: `DiveLogService.activity(userId)` (dives, sites, countries, deepest), `PostService.publishedCount(userId)`, and `SiteCatalogService.approvedCount(userId)`.
- A deleted dive lowers progress but never removes an award. Progress is honest about the data and the award is a record of what happened.
- "5 published posts" counts current published posts, which needs no new column. So `PostPublished` fires on every move to published, not only the first: otherwise publishing a post again could reach the target without an evaluation.
- `DiveLogged` fires on create and edit, and not on delete, which can only lower numbers.
- `SiteApproved` carries the author's id, and is not published for a site with no author, such as a seeded one.

Each event is a record holding the user's id, in its publisher's `service` package.

### D3. After commit, in a new transaction, in the request's thread

`AchievementListener` uses `@TransactionalEventListener(phase = AFTER_COMMIT)` with a `REQUIRES_NEW` transaction, for all three events.

- It runs before the service call returns to the controller, so the award exists when the API answers. "Awarded immediately" and the banner both rely on this.
- It is not `@Async`, for the same reason.
- Spring logs an exception from an after-commit listener instead of propagating it, so a failure cannot undo or refuse the saved action. The next event evaluates again, and repairs a missed award.

Activity from before this change earns nothing until the user's next relevant action. The stack holds only demo data, so a backfill is not worth a second code path. `complete-demo-seed` gets a note to call `AchievementService.evaluate` for its seeded users.

### D4. Endpoint and privacy

`GET /api/v1/users/{id}/achievements` answers `AchievementResponse[]`: `code`, `target`, `progress?`, `earnedAt?`. It costs at most a fixed number of queries and has no paging, as there are only eight.

Progress exposes dive counts, so it follows `showStatistics`: left out for everyone but the owner when statistics are hidden. Admins get no exception, matching the dive statistics. Earned dates stay public: an earned badge is what a profile is for, and reveals only a threshold.

### D5. The banner compares before and after

`DiveLogPage` holds the signed-in user's achievements in a query. After a save, it refetches them and shows the ones earned now that were not earned before. The API and the dive response stay unchanged, and the dive log feature does not need to know about awards. If the first load has not finished when the user saves, there is no banner, and the profile still shows the award.

`DiveForm.onDone` is already called after a save and a delete. The page keeps the unlocked list in its state, and passes it to the form, which renders the alert above the Save button, as the design places it. The form is remounted by its `key` after a save, so the state lives in the page. A later save replaces the list, and starting an edit clears it.

### D6. Front-end

`features/achievement/`: `api.ts`, `ProfileAchievements`, `UnlockedBanner` and `Achievement.module.css`.

- `ProfileAchievements` sits between `ProfileCertificates` and `ProfileDives`, waiting for the session like them, so the owner's token reaches the request.
- The cards follow the design, with its lock and medal icons as inline SVG. The grid wraps by width rather than the design's fixed four columns, so it works at phone width.
- The progress bar is a `div` with `role="progressbar"`, `aria-valuenow`, `aria-valuemax` and an accessible name, and its width is set inline as a percentage, which the tokens-only check allows.
- i18n: `achievement.*` in `en` and `uk`, with `achievement.items.<code>.name` and `.description`. Locale coverage of the codes is tested in `ReferenceDataLocaleIT`, alongside regions and gear.

## Risks / Trade-offs

- Each relevant action costs about four extra queries. That is acceptable for these low-frequency writes.
- An award made by another tab could show as new in a banner. It is harmless.

## Migration Plan

Additive migration; nothing existing changes.

## Open Questions

None.
