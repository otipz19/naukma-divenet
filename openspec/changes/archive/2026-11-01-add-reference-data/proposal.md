# Proposal

## Why

Sites, filters, submissions and post links all depend on a fixed list of countries,
regions and gear (PRODUCT.md domain decisions). This data has to exist before
`add-dive-site-catalog` can give a site its region and gear. This change supplies
the data side of US-05 and US-15.

## What Changes

- Add a seeded country → region hierarchy and a seeded gear catalog through Flyway migrations.
- Add two public read endpoints: `GET /api/v1/countries` (each country with its
  regions) and `GET /api/v1/gear-items`.
- Add `en` and `uk` display names for every country, region and gear item to the
  locale files, keyed by stable code.
- Add a test that fails when a seeded code has no locale entry, or a locale entry has no seeded code.

Out of scope:

- Any UI. The first screens to use this data arrive with `add-dive-site-catalog`,
  `add-site-search-and-filters` and `add-site-submission-and-moderation`.
- Filtering, and linking sites or posts to this data; those changes add it.
- Admin editing of reference data. The lists are fixed; a new entry is a new migration.
- Searching by Ukrainian place names. `add-site-search-and-filters` must solve this
  on top of the codes from this change (design D3).

There is no departure from `docs/ARCHITECTURE.md`, so no new ADR. The rule for
naming reference data (D3) is added to that file as a refinement.

## Capabilities

### New Capabilities

- `geo`: the fixed country and region hierarchy and how clients read it.
- `site/gear-catalog`: the fixed list of gear items and how clients read it.

### Modified Capabilities

None.

## Impact

- **Database:** migrations `V3__create_countries_and_regions.sql` and `V4__create_gear_items.sql`.
- **Back-end:** new `geo` feature package; first code in the `site` package (gear only).
- **API:** two new public GET endpoints; regenerated `api/openapi.json` and `frontend/src/api/schema.gen.ts`.
- **Front-end:** new keys in `frontend/src/i18n/locales/{en,uk}.json`; no components.
- **Docs:** `docs/ARCHITECTURE.md` (existing tables, naming rule), `docs/ROADMAP.md`, `docs/HANDOFF.yaml`.
- **Dependencies:** none added.
