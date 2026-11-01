# Design

## Context

See proposal.md for motivation. `User` has `isShowDiveLog()` and `isShowStatistics()`, which nothing reads yet. The `divelog`
package does not exist. `GET /api/v1/**` is public by default, so each read checks privacy itself. Migrations run up to V11.

## Goals / Non-Goals

**Goals:**

- A log a diver can keep from the map to the table in a few clicks.
- Privacy enforced at the API, so the UI cannot leak by mistake.

**Non-Goals:**

- Dive computer imports, or tagging buddies as users. Buddies are free text.
- The achievement banner and `DiveLogged` event: a note hands them to `add-achievements`.

## Decisions

### D1: Schema

`V12__create_dive_log_entries.sql`:

```sql
dive_log_entries (
  id bigint identity PK,
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  site_id bigint NOT NULL REFERENCES sites,
  dive_date date NOT NULL,
  max_depth numeric(4,1) CHECK (BETWEEN 0 AND 400),
  visibility numeric(4,1) CHECK (BETWEEN 0 AND 200),
  water_temperature numeric(3,1) CHECK (BETWEEN -5 AND 40),
  current_strength varchar(16) CHECK (IN ('NONE','MILD','MODERATE','STRONG')),
  buddies varchar(200),
  notes varchar(2000),
  created_at, updated_at timestamptz NOT NULL
)
```

An index on `(user_id, dive_date DESC, id DESC)` serves the log, and one on `site_id` the foreign key. `current` is a reserved word in
SQL, hence the column name. The checks are a second line behind the API, as on `sites`.

### D2: API

| Endpoint | Auth | Notes |
| --- | --- | --- |
| `POST /api/v1/dive-log` | signed in | 201 |
| `PUT /api/v1/dive-log/{id}` | author | full replace |
| `DELETE /api/v1/dive-log/{id}` | author | 204 |
| `GET /api/v1/users/{id}/dive-log` | public, `showDiveLog` | paged with `@ParameterObject`, newest dive first, then id |
| `GET /api/v1/users/{id}/visited-sites` | public, `showDiveLog` | unpaged: bounded by the catalog |
| `GET /api/v1/users/{id}/dive-stats` | public, `showStatistics` | one aggregate query |

There is no `GET /dive-log/{id}`: Edit fills the form from the row. The owner's own row holds everything.

`current` is a string on the service and web sides with `@Schema(allowableValues)`, as warning types are, and `@Pattern` gives the
field error. `web` then never imports the domain enum.

### D3: Privacy

`DiveLogService` takes the viewer's id, from an optional `Jwt`, on each read. A hidden section answers 403 rather than an empty list: an empty
list would read as "no dives", while the UI uses the flags from the profile to show a notice and not ask at all. Admins get no exception,
because the note and US-11 name only the owner. Buddies and notes are nulled in the service for anyone but the owner, since they can name people
who did not agree to appear. This goes beyond the note; the proposal review should confirm it.

### D4: Dates

`dive_date` is a `LocalDate`, as `ARCHITECTURE.md` requires. The future check allows one day past the server's UTC date, because a diver in Kyiv
can already be on a date UTC has not reached. The UI formats dates with `timeZone: "UTC"`, because `new Date("2026-05-12")` is UTC midnight and
would show the previous day west of Greenwich. The form's default is the browser's local date.

### D5: Approved sites only

`SiteCatalogService` gains `findApproved(id)`, returning an `Optional`, which `DiveLogService` maps to a `siteId` field error. An author's own pending site cannot be
logged: a site in the log appears on public pages, and that would reveal it before approval.

### D6: Front-end

- `features/divelog/DiveLogPage` at `/dive-log` in `RequireAuth`, following `DiveLog.html`: the table and the form side by side, stacked on narrow
  screens, with the table scrolling sideways inside its card.
- `SitePicker`: a search `TextField` that queries the markers endpoint after a 300 ms pause, with results as a list of buttons, and a chosen site shown with
  a Change button. A native `datalist` was rejected, because it cannot carry an id. The search reuses `toMarkerQuery`, so Ukrainian place names work.
- The form is React Hook Form with a Zod schema; numbers stay strings while edited, as in `SubmitSitePage`.
- `useInfiniteQuery` drives "Load more" on the page and the profile.
- `features/divelog/ProfileDives` is rendered by `ProfilePage`: statistics in the mockup's `dl`, visited sites, read-only history and notices. It computes
  `canSeeLog` and `canSeeStats` from the flags and the session, and leaves those queries disabled otherwise. `ProfilePage` must wait for the session before
  rendering it, so the owner of a hidden section is not treated as a stranger on reload.
- `SitePage` gets the "Log a dive here" link beside "Write a review".
- `navigation.ts` gets the "Dive log" entry for everyone, as in the mockups; signed-out visitors meet the login page.

### i18n

No new namespace. New key groups: `divelog.*`, plus `shell.nav.diveLog` and `site.details.logDive`.

## Risks / Trade-offs

- [The stats and the table disagree briefly after a save] → Saving invalidates both.
- [Delete confirmation in the form] → It uses the inline confirm pattern of `ReviewCard`, not `window.confirm`.
- [Public flags tell visitors what is hidden] → Accepted in `add-diver-profile`.
- [The visited-sites list grows with the catalog] → Small at this size; it has one row per site at most.

## Migration Plan

Forward-only migration adding one table.

## Implementation notes

- The statistics line reads "Dives: 1 · Sites: 1", not the mockup's "47 dives", to avoid plural forms: "1 dives" was found in the browser check, and Ukrainian needs several plurals.
- Numbers go through `Intl.NumberFormat`, so Ukrainian shows "30,4". The form's inputs still take a decimal point.
- Edit scrolls the form into view, because it sits below the table on a phone.
- A diver's log has no success message: the cleared form and the new row show the result.
