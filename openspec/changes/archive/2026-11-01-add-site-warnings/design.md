# Design

## Context

See proposal.md for motivation; the behaviour is in the delta specs. What exists:

- `site`: `SiteCatalogService.site(id, Viewer)` returns a `SiteView` or throws
  `SiteNotFoundException` (404) for unknown sites and for unapproved sites the viewer may not see;
  `new Viewer(null, false)` is "anyone", so it answers 404 for every unapproved site.
  `SiteRepository` is public.
- `review` is the closest model: `ReviewController` (site-scoped list and create, id-scoped
  edit and delete, `Location` header), `ReviewExceptions` (404, 403, 400 with `errors`),
  `ReviewView` records, `useInvalidateReviews`, `SiteReviews` and `ReviewFormPage` with
  `RequireAuth`.
- `GlobalExceptionHandler` turns bean-validation failures into 400 with `errors`; an unreadable
  body (for example an unknown enum constant in JSON) is a plain 400 from the superclass, without
  `errors`.
- `SecurityConfig`: `/api/v1/admin/**` needs `ADMIN`; GETs under `/api/v1/**` are public except
  a listed few; every other request needs authentication.
- Front-end: `Alert` takes `tone`, `title` and children only; the session exposes
  `session.user.role`.

## Goals / Non-Goals

**Goals:**

- `warning` depends on `site` and `user`; nothing depends on `warning`.
- A hidden warning behaves as deleted for every reader and for its author, but the row stays for
  the record.
- An unknown type is a field error on `type`, like every other validation failure.

**Non-Goals:**

- Un-hiding, an admin list of hidden warnings, reporting a warning, expiry.
- Showing warning counts on the map or on site cards.

## Decisions

### D1: Schema (`V10__create_warnings.sql`)

```sql
warnings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id bigint NOT NULL REFERENCES sites (id),
  author_id bigint NOT NULL REFERENCES users (id),
  type varchar(32) NOT NULL CHECK (type IN ('HAZARD','INCIDENT','CHANGED_CONDITIONS','MARINE_LIFE')),
  text varchar(1000) NOT NULL CHECK (btrim(text) <> ''),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  hidden_at timestamptz,
  hidden_by bigint REFERENCES users (id),
  CHECK ((hidden_at IS NULL) = (hidden_by IS NULL))
)
INDEX warnings_site_visible (site_id, created_at DESC) WHERE hidden_at IS NULL
INDEX warnings_author_id_idx (author_id)
```

The type is a string column mapped with `@Enumerated(STRING)`, like `sites.status`. The partial
index serves the only list query (visible warnings of one site, newest first). Several warnings
per user per site are allowed: conditions change, unlike an opinion.

Alternative: a `hidden boolean` without who and when. Rejected: the two columns cost nothing and
answer "who hid this" if the row is ever looked at.

### D2: Hiding is a soft delete scoped to the repository

`WarningRepository` reads only rows with `hidden_at IS NULL` (`findVisibleById`,
`findVisibleBySite` ordered by `created_at DESC, id DESC`). Get, edit and delete load through
`findVisibleById`, so a hidden warning is 404 everywhere without per-call checks. Hide loads with
plain `findById` (404 only when the row does not exist), and is a no-op when `hidden_at` is set,
which makes it idempotent.

Alternative: a Hibernate `@SQLRestriction` on the entity. Rejected: hide itself must see hidden
rows, and an entity-wide filter makes that path awkward.

### D3: Sites are checked through `SiteCatalogService`, linked by reference

`WarningService` calls `catalog.site(siteId, ANYONE)` for list and create (404 for unknown and
unapproved sites, the same answer as the site page) and links the new warning with
`SiteRepository.getReferenceById(siteId)`. No lock: warnings have no aggregates, so concurrent
writes cannot conflict. No new `site` method is needed.

### D4: `type` is a string in the request, an enum in the response

`WarningRequest.type` is a `String` with `@NotBlank` and
`@Pattern(regexp = "(?i)HAZARD|INCIDENT|CHANGED_CONDITIONS|MARINE_LIFE")`, documented with
`@Schema(allowableValues = ...)` so the generated TypeScript type is the four-value union. The
controller converts it with `WarningType.valueOf(type.toUpperCase(Locale.ROOT))`. This keeps an
unknown or missing type a 400 with a field error on `type` (spec warning/warnings), which a JSON
enum would turn into an unreadable-body 400 without `errors`. `WarningResponse.type` is the
`WarningType` enum. `text` has `@NotBlank @Size(max = 1000)`; the service strips it.

### D5: Endpoints

| Method and path | Auth | Answer |
| --- | --- | --- |
| `GET /api/v1/sites/{siteId}/warnings?page&size` | public | `PagedModel<WarningResponse>`, newest first |
| `POST /api/v1/sites/{siteId}/warnings` | signed in | 201, `Location: /api/v1/warnings/{id}` |
| `GET /api/v1/warnings/{id}` | public | `WarningResponse` |
| `PUT /api/v1/warnings/{id}` | author | `WarningResponse` |
| `DELETE /api/v1/warnings/{id}` | author | 204 |
| `POST /api/v1/admin/warnings/{id}/hide` | admin | 204 |

`WarningResponse` is `{ id, siteId, type, text, author: { id, displayName }, createdAt,
updatedAt }`, every property required. The list takes `@ParameterObject Pageable` and the
service builds `PageRequest.of(page, size)` without the client's sort, since the order is fixed
(the ARCHITECTURE.md convention for paged lists). The public GETs and the authenticated writes
already fall under the existing `SecurityConfig` rules; the admin path under `/api/v1/admin/**`.
`SecurityConfig` does not change. Errors come from `WarningExceptions`: `WarningNotFoundException`
(404) and `NotWarningAuthorException` (403).

### D6: Front-end layout

`src/features/warning/`:

- `api.ts`: `fetchWarnings`, `fetchWarning`, create, update, delete and hide calls through the
  typed client; `warningKeys`; `useInvalidateWarnings(siteId)`.
- `SiteWarnings.tsx`: the section. `useInfiniteQuery` with the default page size; renders the
  first two warnings until "Show all warnings (n)" is pressed (n is `page.totalElements`).
  Delete and Hide confirm inline (a group with the question, a confirm and a Cancel button),
  as `ReviewCard` does for review delete.
- `WarningAlert.tsx`: one warning. `Alert` gains an optional `actions` slot (a `ReactNode`
  rendered after the body) for the Edit, Delete and Hide buttons; the existing props do not
  change. The tone map `HAZARD | INCIDENT → danger`, others `→ caution` lives here.
- `relativeDate.ts`: today, yesterday and "n days ago" through `Intl.RelativeTimeFormat` with
  `numeric: "auto"` in the active language, counted in calendar days; the `Intl.DateTimeFormat`
  date (`day numeric, month short, year numeric`) after 30 days. Unit-tested with a fixed clock.
- `WarningFormPage.tsx`: one component for both routes (`/sites/:id/warnings/new` and
  `/sites/:id/warnings/:warningId/edit`), React Hook Form with a zod schema as the review form
  does, `SelectField` and `TextAreaField`. On edit, a warning whose `author.id` is not
  the signed-in user's shows the not-found message, so no form leads to a certain 403.
- `routes.tsx`: both routes in `RequireAuth`, added to `src/app/router.tsx`.

`SitePage` renders `<SiteWarnings siteId>` between the head and "About this site" for approved
sites only.

### D7: i18n namespace `warning`

`warning.title`, `warning.report`, `warning.empty`, `warning.loadError`, `warning.showAll`
(with `{{n}}`), `warning.loadMore`, `warning.edit`, `warning.delete`, `warning.deleteConfirm`,
`warning.deleteFailed`, `warning.hide`, `warning.hideConfirm`, `warning.hideFailed`,
`warning.types.{HAZARD,INCIDENT,CHANGED_CONDITIONS,MARINE_LIFE}`, and `warning.form.*` (headings,
labels, placeholder, buttons, required messages, error, not-found). Relative dates come from
`Intl`, not from locale keys.

## Risks / Trade-offs

- [A hidden warning's author cannot see why it vanished] → Accepted for this project; the row
  keeps who hid it and when, and reporting or notifications are out of scope.
- [Spam: nothing limits how many warnings a user posts] → Admins hide them; rate limiting is out
  of scope for the demo.
- [Relative dates depend on the viewer's clock and time zone] → Calendar days are counted in the
  viewer's local zone, which is what "yesterday" means to them; tests fix the clock.

## Migration Plan

Additive: one new table and new endpoints. Rollback is reverting the PR on a fresh database;
`V10` is never edited once merged.
