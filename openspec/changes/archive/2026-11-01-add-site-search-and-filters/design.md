# Design

## Context

See proposal.md for motivation. `GET /api/v1/sites/markers` returns every site with all the
fields a SiteCard shows (`add-dive-site-catalog`). `add-reference-data` D3 keeps Ukrainian only
in the locale files, so the server can match English names only. `pg_trgm` is enabled (V1);
`GET /countries` and `GET /gear-items` exist but have no UI yet.

## Goals / Non-Goals

**Goals:**

- One filter definition that drives the map and the list together.
- Ukrainian place-name search without Ukrainian in the database.

**Non-Goals:**

- Translating site names, which are user content; a Latin site name is matched as written.
- Viewport or radius search.
- A draggable sheet. The sheet expands with a button.

## Decisions

### D1: Filters live on the markers endpoint; no paged list endpoint

`ARCHITECTURE.md` gives markers "the same filter parameters as the site search". The result
list uses the same response, because it holds every SiteCard field and the map needs the whole
matching set anyway. Alternative: also add a paged `GET /sites`. Rejected: a second endpoint
and a second request for the same rows at this data size. A later change can add it if the
catalog outgrows one response.

| Parameter | Meaning |
| --- | --- |
| `q` | name, region name or country name contains it, ignoring case |
| `qRegion`, `qCountry` (repeated) | codes that also count as text matches |
| `difficulty` (repeated) | any of |
| `gear` (repeated) | the site requires all of them |
| `country`, `region` | exact code |
| `minDepth`, `maxDepth` | overlap: `max_depth >= minDepth` and `min_depth <= maxDepth` |

The mockup confirms the overlap: its filter of 5–30 m lists a site at 16–32 m. The gear
semantics follow the Chip README: within a group chips usually mean "any of", but for gear
"any of" would answer no real question, since a diver filtering by required gear wants sites
needing those items together. The word "Required" stays in the legend. This is a deliberate
exception to that README line.

### D2: Query with a JPA Specification

`SiteRepository` extends `JpaSpecificationExecutor`. `SiteFilter` (a record in `site.service`, since
`web` may not touch `domain`) is turned into predicates by `SiteSearch`, also in `site.service`; only supplied filters add one. Text matching uses
`HibernateCriteriaBuilder.ilike` with `\` as the escape character, after escaping `\`, `%` and
`_`. Gear uses one `EXISTS` subquery per code, against `site_gear` with `REQUIRED`. The
specification fetch-joins region and country as `findAllWithRegion` does, which it replaces.
Alternative: a dynamic native query. Rejected: string building for no benefit; the spec is
simple and typed.

`V6__add_site_name_trigram_index.sql`: `CREATE INDEX sites_name_trgm_idx ON sites USING gin (name gin_trgm_ops)`.

### D3: Ukrainian search through codes

The server cannot match "дахаб", so the client does: it looks through the active language's
`geo.regions` and `geo.countries` for names containing the text, ignoring case, and sends those
codes as `qRegion` and `qCountry` beside `q`. Any language works this way, and the requests stay
cacheable by their parameters. In `en` the codes repeat what the server finds, which is harmless.

Alternatives: filtering all text on the client from a full list. Rejected, because it splits the
filter logic in two. `name_uk` columns. Rejected by `add-reference-data` D3.

### D4: The URL is the state

`useSearchParams` holds `q`, `difficulty` (words), `gear`, `country`, `region`, `minDepth` and
`maxDepth`. The query key derives from them, so the back button and sharing work. Typing is
debounced by 300 ms and replaces the history entry rather than adding one. Other filter changes
push an entry. `keepPreviousData` stops the list flashing between requests. Unknown values in a
hand-edited URL are ignored by the UI, and a non-numeric depth is not sent, so such a URL cannot
produce a 400.

The difficulty word maps to levels through the helper from `add-dive-site-catalog` D3, extended
with its reverse (`intermediate` → 2, 3).

### D5: Layout

- **At 1100 px and above:** a side panel beside the map as in `Map.html`, scrolling within the
  map's height.
- **Below:** the map takes the width; the search box and a "Filters · n" button sit above it, the
  filters expand beneath them, and a results sheet overlays the map's bottom, with a count and an
  expand button. This is simpler than `MobileMap.html`'s overlay search box, which would cover map
  controls, but keeps its sheet.
- **Disclaimer:** the footer stays (`add-dive-site-catalog` D5), so the strip is not added.
- **Popup and card:** when a popup's site leaves the results, the popup closes. The list card of
  the open popup gets SiteCard's selected state, which is built now that something selects a card.
- **Sorting:** the API orders by name; a screen in `uk` keeps that order, since site names
  are Latin. Country and region selects sort with `Intl.Collator` for the active language.

### New components and i18n

`components/Chip` follows its README. `components/SelectField` matches TextField's label and input
styles. No new namespace; new keys are under `site.search.*`.

## Risks / Trade-offs

- [One response holds all matches] → Small at this size; D1 names the way out.
- [Client-side name matching depends on bundled locale files] → They are the only source of the
  translations, and `ReferenceDataLocaleIT` keeps them complete.
- [Inflected Ukrainian words: the query "Дахабі" does not match the name "Дахаб"] → Substring
  search handles the base form and partial words. Stemming is out of scope.
- [Rating filter missing until M2] → `Map.html` shows it; it arrives with the data it needs,
  recorded on the roadmap.

## Migration Plan

Forward-only index migration; the API change only adds optional parameters.

## Implementation notes

- `SiteFilter` and `SiteSearch` live in `site.service`, not `site.domain`: the controller builds the filter, and the layer rule forbids `web` from using `domain`.
- A `%` in a MockMvc URL template is encoded again, so tests of literal wildcards pass `q` with `.param`.
