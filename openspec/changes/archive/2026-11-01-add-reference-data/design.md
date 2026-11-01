# Design

## Context

See proposal.md for motivation. `ARCHITECTURE.md` places countries and regions in the
`geo` package and gear in `site`, and puts reference data in migrations. Migrations
V1 and V2 exist; the `geo` and `site` packages do not. GET requests under `/api/v1/**`
are already public (`SecurityConfig`). AGENTS.md allows Ukrainian text only in the `uk`
locale file, and the gate checks `en`/`uk` key parity.

## Goals / Non-Goals

**Goals:**

- Enough regions for the ~50 real sites planned for `add-dive-site-catalog`.
- Identifiers that later migrations, the demo seeder and URLs can use directly.

**Non-Goals:**

- A complete list of the world's countries, or caching. The data is small and read rarely.
- Front-end hooks or components with no screen to use them yet.

## Decisions

### D1: Natural string keys

`countries.code`, `regions.code` and `gear_items.code` are the primary keys; there are
no numeric ids. Later migrations, seed files and the API can then refer to `eg-dahab`
without a lookup, and the value is readable in a filter URL.
Alternative: identity ids like `users`, plus a unique code. Rejected: two identifiers
for data that never changes, and generated ids would differ between environments.

### D2: One nested countries endpoint, no pagination

| Endpoint | Response |
| --- | --- |
| `GET /api/v1/countries` | `[{ code, name, regions: [{ code, name }] }]` |
| `GET /api/v1/gear-items` | `[{ code, name }]` |

All the mockups that show a country and region select (Map, Feed, SubmitSite,
PostEditor) need both lists, and the whole payload is small. One request serves them all.
Unpaged lists follow the markers endpoint's precedent for data a client needs entire.
Alternative: `GET /countries/{code}/regions`. Rejected: an extra request and a 404 case
that no screen needs.

The service loads countries with their regions in one query (`join fetch`), and returns
records declared in its `service` package. Entities stay out of `web`.

### D3: English in the database, translations in the locale files

The tables hold an English `name`; the API returns it. The UI displays
`t("geo.countries.EG")`, `t("geo.regions.eg-dahab")` and `t("gear.torch")`. This keeps
Ukrainian in the `uk` locale file as AGENTS.md requires, and the existing parity check
covers it. The English `name` remains for API readers, sorting and the planned `ILIKE`
search.

Alternative: `name_en` and `name_uk` columns, returning the name for the request's
language. Rejected: it puts Ukrainian in migrations, against AGENTS.md, and adds language
negotiation the API does not have.

Consequence: server-side search matches only English names. `add-site-search-and-filters`
must cover US-06 for Ukrainian users, for example by having the client match its
translated names and send the resulting codes as filters. That change decides how.

The API order is by English name, so a screen that displays Ukrainian names sorts them
itself with `Intl.Collator`.

### D4: A test keeps the database and the locale files in step

`ReferenceDataLocaleIT` reads `../frontend/src/i18n/locales/en.json` (relative to
`backend/`, where Maven runs) and compares its keys with the seeded codes in both
directions. The existing parity step then carries the check over to `uk`. The test is
the only link from `backend` to `frontend` sources, and only at test time.
Alternative: a new step in `scripts/check.mjs` parsing SQL. Rejected: fragile, and that
file needs the user's permission to edit.

### D5: Seed contents

Migration tables:

```sql
countries  (code varchar(2) PK, name varchar(100) NOT NULL UNIQUE)
regions    (code varchar(50) PK, country_code varchar(2) NOT NULL REFERENCES countries,
            name varchar(100) NOT NULL, UNIQUE (country_code, name))
gear_items (code varchar(50) PK, name varchar(100) NOT NULL UNIQUE)
```

An index on `regions.country_code` is omitted; the table is tiny and always read whole.

| Country | Regions (code suffix) |
| --- | --- |
| Australia (AU) | Great Barrier Reef (`great-barrier-reef`), Western Australia (`western-australia`) |
| Belize (BZ) | Lighthouse Reef (`lighthouse-reef`) |
| Croatia (HR) | Istria (`istria`), Dalmatia (`dalmatia`) |
| Ecuador (EC) | Galápagos (`galapagos`) |
| Egypt (EG) | Dahab (`dahab`), Hurghada (`hurghada`), Marsa Alam (`marsa-alam`), Sharm El Sheikh (`sharm-el-sheikh`) |
| Greece (GR) | Crete (`crete`), Santorini (`santorini`) |
| Iceland (IS) | Thingvellir (`thingvellir`) |
| Indonesia (ID) | Bali (`bali`), Komodo (`komodo`), Raja Ampat (`raja-ampat`) |
| Italy (IT) | Sardinia (`sardinia`), Sicily (`sicily`) |
| Malaysia (MY) | Sipadan (`sipadan`) |
| Maldives (MV) | Ari Atoll (`ari-atoll`), North Malé Atoll (`north-male-atoll`) |
| Malta (MT) | Gozo (`gozo`), Malta Island (`malta-island`) |
| Mexico (MX) | Cozumel (`cozumel`), Riviera Maya (`riviera-maya`), Socorro Islands (`socorro`) |
| Palau (PW) | Koror (`koror`) |
| Philippines (PH) | Malapascua (`malapascua`), Palawan (`palawan`), Tubbataha (`tubbataha`) |
| Portugal (PT) | Azores (`azores`), Madeira (`madeira`) |
| South Africa (ZA) | Aliwal Shoal (`aliwal-shoal`), Sodwana Bay (`sodwana-bay`) |
| Spain (ES) | Canary Islands (`canary-islands`), Costa Brava (`costa-brava`) |
| Thailand (TH) | Koh Tao (`koh-tao`), Similan Islands (`similan-islands`) |
| Turkey (TR) | Kaş (`kas`) |
| Ukraine (UA) | Kyiv Region (`kyiv`), Odesa Region (`odesa`) |
| United States (US) | Florida Keys (`florida-keys`), Hawaii (`hawaii`) |

A region's full code is the lower-case country code, a hyphen and the suffix, for
example `eg-dahab`.

Gear: Dive computer (`dive-computer`), Drysuit (`drysuit`), Compass (`compass`), Nitrox
(`nitrox`), Reef hook (`reef-hook`), SMB (`smb`), Torch (`torch`), Twin set (`twin-set`),
Wetsuit (`wetsuit`). The first mockups use Torch, Drysuit, SMB, Nitrox and Reef hook.

### i18n

No new namespace; the project has one `translation` namespace. New key groups:
`geo.countries.*`, `geo.regions.*`, `gear.*`.

## Risks / Trade-offs

- [Locale keys have no screen until M1 continues] → D4's test exercises them, and they
  belong with the data they name.
- [A code cannot change after a site refers to it] → Codes are chosen here; a correction
  is a new migration that also updates the referencing rows.
- [`ReferenceDataLocaleIT` depends on the repository layout] → It runs only in `mvnw
  verify` from a full checkout. Task 1.1 confirms that the Docker build skips tests or
  does not need the file.

## Migration Plan

Forward-only Flyway migrations on tables nothing references yet. There is no rollback
beyond restoring the database, which the local stack can recreate.
