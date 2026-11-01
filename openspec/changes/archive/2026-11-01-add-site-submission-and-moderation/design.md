# Design

## Context

See proposal.md for motivation. `Site` has no status or author, and only `SiteDemoSeeder` writes
sites. `SecurityConfig` makes every `GET /api/v1/**` public except `/auth/me`, and
`/api/v1/admin/**` needs `ADMIN`. The access token lives in memory, so after a reload a page runs
before the session is restored. PostGIS coerces out-of-range `geography` values
(`add-dive-site-catalog` notes), so the API must check them.

## Goals / Non-Goals

**Goals:**

- A submission is invisible to others at every endpoint until approved.
- The full demo journey: a diver submits, an admin approves, the site appears on the map.

**Non-Goals:**

- Editing submissions, notifications, duplicate detection, or audit history of moderators.

## Decisions

### D1: Schema

`V7__add_site_moderation.sql` adds to `sites`:

```sql
status varchar(16) NOT NULL  -- PENDING, APPROVED, REJECTED; existing rows are backfilled APPROVED
author_id bigint REFERENCES users ON DELETE SET NULL  -- null for seeded sites
rejection_reason varchar(500)
CHECK ((status = 'REJECTED') = (rejection_reason IS NOT NULL))
```

Plus indexes on `(status, created_at)` and `author_id`. There is no column default after the backfill, so
every insert states its status. The seeder's sites are approved through the existing public constructor;
`Site.submission(...)` creates pending ones. `SiteModerationService` checks that a site is
pending before calling `approve()` or `reject(reason)`, so the rule has one home.

### D2: API

| Endpoint | Auth | Answer |
| --- | --- | --- |
| `POST /api/v1/sites` | signed in | 201, `SiteResponse` |
| `GET /api/v1/sites/mine` | signed in | `[{ id, name, status, rejectionReason }]`, unpaged |
| `GET /api/v1/sites/{id}` | public, narrowed by status | `SiteResponse` + `status`, `rejectionReason` |
| `GET /api/v1/admin/sites` | admin | paged `{ ...site, authorName }`, oldest first |
| `POST /api/v1/admin/sites/{id}/approve` | admin | `SiteResponse` |
| `POST /api/v1/admin/sites/{id}/reject` | admin | `{ reason }` → `SiteResponse` |

`/mine` is unpaged because one author's list is small. The queue is paged because any user can grow it,
but the page shows only the first 20: moderating removes cards, which brings the next ones up.
`SecurityConfig` adds `GET /api/v1/sites/mine` as authenticated before the public GET rule.

### D3: Hiding unapproved sites

The site read takes a `Viewer(userId, admin)` built from the optional `Jwt`, and treats a hidden
site as `SiteNotFoundException`, so a 404 does not reveal that it exists. Moderators and authors
read through the same path. `SiteSearch` always adds `status = APPROVED`, so filters cannot
bypass it.

### D4: Validation

Single fields use bean validation on the request record, giving the existing `errors` list.
Rules needing several fields or the database (depth order, unknown codes, gear listed twice) run in
`SiteCatalogService`, which throws `InvalidSiteException`: an `ErrorResponseException` with a
400 problem whose `errors` property has the same `FieldViolation` shape. So clients see one format.
The depth limit of 400 m only catches typos.

### D5: The page waits for the session

`SitePage` keeps its query disabled while the session is `loading`, and its key includes the user id,
so signing in or out refetches. Public visitors wait only for the refresh call that every page
already makes. Alternative: retry after a 404. Rejected: it would flash the not-found page.

### D6: Front-end

- `features/auth/RequireAuth` renders nothing while loading, redirects signed-out visitors to
  `/login` with `from`, and renders its children otherwise; with `admin`, a non-admin gets `NotFoundPage`.
- `/sites/new` (`SubmitSitePage`) follows `SubmitSite.html`: a React Hook Form with a Zod schema, as in the auth
  pages. `useMapEvents` handles the click; the marker reuses the map's pin icon.
- **Gear chips are added, though the mockup's form has none,** because sites need gear data for
  the gear filter and the facts card. Pressing a chip in one group clears it from the other, so a
  gear item cannot be both.
- **Difficulty is a select with five levels** ("3 · Intermediate"), not the mockup's four chips. PRODUCT.md
  has five levels, four chips could not express them, and the Chip README sends single choices to a select.
- `TextField`'s sibling for the description: a `TextAreaField` sharing its styles.
- `/admin/moderation` (`ModerationPage`) follows `Moderation.html`'s first card, without tabs, duplicate
  notice and thumbnail. A 409 shows an alert and refetches.
- The map panel links to `/sites/new`; the account menu and drawer link admins to moderation.
- After any change, the `["sites"]` query keys are invalidated, so the map and lists follow.

### i18n

No new namespace. New key groups: `site.submit.*`, `site.moderation.*`, `site.status.*`, `site.errors.*`.

## Risks / Trade-offs

- [Two admins act at once] → The second read sees a non-pending site and gets 409 when the writes do not
  overlap. Overlapping transactions could both pass; the last write wins. One demo admin makes this
  acceptable, so no locking is added.
- [Any user can fill the queue] → Unbounded by design here; rate limiting is out of scope.
- [User text in the queue] → React escapes it. The OpenStreetMap link is built from validated numbers.
- [Site name language] → Names and descriptions are user content and are not translated.

## Migration Plan

Forward-only. The migration backfills existing rows as `APPROVED`, so a seeded database keeps its map.

## Implementation notes

- `Viewer` and `Submission` are records in `SiteCatalogService`, because the layer rule keeps `web` from `domain`.
- The queue's `Pageable` needs `@ParameterObject`; without it the contract requires a `pageable` object. Use it on every paged endpoint.
- The form's outcome alert sits beside the submit button; at the top of the long form it was out of view (found in the browser check).
- Typecheck with `tsc -b` as the gate does: `tsc --noEmit` checks nothing here, since the root config only has references.
