# Proposal

## Why

Only the demo seeder can create sites, so the community cannot grow the map. This change
delivers US-07 (submit a site and see its status) and US-08 (an admin approves or rejects
with a reason), and finishes M1.

## What Changes

- Sites gain a moderation status, an optional author and a rejection reason. Existing and
  seeded sites are approved.
- Add `POST /api/v1/sites`, `GET /api/v1/sites/mine`, `GET /api/v1/admin/sites`,
  `POST /api/v1/admin/sites/{id}/approve` and `POST /api/v1/admin/sites/{id}/reject`.
- **BREAKING (behaviour):** the markers endpoint and search return approved sites only, and an
  unapproved site's page answers 404 except to its author and admins.
- Add the submission page at `/sites/new` with a location picker and the author's submissions,
  the moderation page at `/admin/moderation`, and a status notice on an unapproved site's page.
- Validate `lat` and `lng` at the API, as `add-dive-site-catalog` requires, because PostGIS
  coerces out-of-range values.

Deferred or left out:

- **Editing or resubmitting** a rejected submission: not in the stories. An author submits again.
- **The "possible duplicate" notice and the map thumbnail** in `Moderation.html`: not in US-08.
  Each queue card links to the location on OpenStreetMap instead.
- **Other moderation tabs:** `add-certificates` and `add-site-warnings` add their own queues, and the tabs with them.
- **`SiteApproved` event:** `add-achievements` adds it with its first consumer.
- **Rate limiting:** a project-wide question, out of scope for a course demo.

There is no departure from `docs/ARCHITECTURE.md`, so no new ADR.

## Capabilities

### New Capabilities

- `site/submission`: how signed-in users submit sites and follow their status.
- `site/moderation`: how admins review submissions.

### Modified Capabilities

- `site/catalog`: public reads return approved sites only; site details carry the status.
- `site/details`: the page shows the status of an unapproved site, and waits for the session.

## Impact

- **Database:** migration `V7__add_site_moderation.sql`.
- **Back-end:** `site` package; `SecurityConfig` protects `GET /api/v1/sites/mine`.
- **API:** five new endpoints and new fields on the site response; regenerated `api/openapi.json` and `frontend/src/api/schema.gen.ts`.
- **Front-end:** `features/site`, a route guard, an account-menu link for admins, a map-panel link, `en` and `uk` strings.
- **Docs:** `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/HANDOFF.yaml`.
- **Dependencies:** none added.
