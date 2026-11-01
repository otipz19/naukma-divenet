# Proposal

## Why

Divers can review sites but cannot record where they have dived, and the profile has nothing to show
beyond a bio. This change delivers US-09 and the dive history, visited sites and statistics of US-11,
and makes the privacy settings from `add-diver-profile` take effect.

## What Changes

- Add dive log entries: a site, a date, and optional max depth, visibility, water temperature, current,
  buddies and notes.
- Add endpoints to create, edit and delete one's own entries, and to read a diver's log, visited sites and
  statistics, guarded by the privacy settings at the API.
- Add the dive log page at `/dive-log` with a "Dive log" navigation entry, and a "Log a dive here" link on the
  site page.
- Add statistics, visited sites and dive history to the profile page, with a notice for hidden sections.

Deferred:

- **The achievement banner in `DiveLog.html` and the `DiveLogged` event:** `add-achievements` adds them with
  their first consumer. A plan-update note records this.
- **Picking on a map inside the form:** a diver reaches a site from the map through its page, whose "Log a dive
  here" link fills in the site. This meets US-09's "from the catalog or the map" without a second map.

There is no departure from `docs/ARCHITECTURE.md`, so no new ADR.

## Plan updates absorbed

- `docs/plan-updates/add-dive-log/add-diver-profile--privacy-settings.md`

## Capabilities

### New Capabilities

- `divelog/entries`: how entries are written and read, including privacy.
- `divelog/log-page`: the page where a diver keeps their log.

### Modified Capabilities

- `user/profile`: the profile page shows dive statistics, visited sites and history, or a notice when hidden.
- `site/details`: the site page links to logging a dive there.

## Impact

- **Database:** migration `V12__create_dive_log_entries.sql`.
- **Back-end:** new `divelog` package; a method on `SiteCatalogService` to check a site is approved.
- **API:** new endpoints, none breaking; regenerated `api/openapi.json` and `frontend/src/api/schema.gen.ts`.
- **Front-end:** new `features/divelog`; `ProfilePage`, `SitePage`, `navigation.ts`; `en` and `uk` strings.
- **Docs:** `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/HANDOFF.yaml`, plan-update notes.
- **Dependencies:** none added.
