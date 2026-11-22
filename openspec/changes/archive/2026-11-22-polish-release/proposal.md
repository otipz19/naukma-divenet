# Proposal

## Why

M6 ends with a release a reviewer can click through without seeing rough edges.
Today a crashing page leaves a blank screen. While data loads, pages are empty.
Every tab is titled "DiveNet". The theme follows only the OS setting (F-08). The
demo feed never has a second page, so US-13 paging cannot be shown (F-06). This is
the last M6 item. It runs after the other M6 items, so its audits cover the
screens they changed.

## What Changes

- **Error page.** When a page crashes while rendering, the app shows a translated
  error page inside the app shell instead of a blank screen. The page has a reload
  button and a link to the map. It never shows the technical error text.
- **Loading placeholders.** The main pages show a placeholder shaped like their
  content while their data loads, and announce "Loading" to screen readers. The
  main pages are the map results, site, feed, post, profile, dive log, certificates
  and moderation pages. A new shared Skeleton component is added to the design
  system and the front-end.
- **Document titles.** Every route sets a translated title of the form
  `<page> · DiveNet`. Site, post and profile pages use the site name, the post
  title or the diver's name. The title updates when the language changes.
- **Empty-state audit.** Every list on every page either shows a translated empty
  message or leaves out its section when the viewer has nothing to see there and
  cannot add anything. The audit records each list and fixes any gap it finds.
- **Theme switch (F-08).** A System / Light / Dark control goes in the header and
  in the phone drawer. System is the default and keeps today's behaviour. The
  choice is kept per browser.
- **More seeded posts (F-06).** The demo seed has at least 45 published posts.
  They are spread across the eight divers, several regions and sites, and the
  text is in each diver's own language. The feed then has at least three pages at
  the current page size of 20. The new posts' covers reuse the pictures the seed
  already generates, and the new posts have no extra photos.

Dropped by the owner on 2026-11-22, not implemented:
- **i18n audit.** This covered attributes, Ukrainian plurals, date and number
  formats and server error messages.
- **F-01.** The `204` for a refresh without a cookie. The signed-out `401` on
  `POST /api/v1/auth/refresh` stays as it is (by design, ADR-0004). F-01 is set
  to declined.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared/app-shell`: the theme follows the visitor's choice, with the system
  preference as the default. The header and the phone drawer get a theme switch.
- `shared/web-app`:
  - an error page for a page that crashes;
  - loading placeholders on the main pages;
  - a document title per route;
  - an empty state for every list.
- `demo/seed`: the seed has at least 45 published posts, and the feed has at
  least three pages.

## Impact

- **Front-end.**
  - `src/app/` (router error route, theme preference, document-title hook).
  - `src/components/` (new `Skeleton` and `ThemeSwitch`; `AppHeader` and
    `NavDrawer` get the switch).
  - Feature pages for placeholders, titles and any empty-state gaps.
  - `en` and `uk` locale files.
- **Back-end.**
  - `backend/src/main/resources/seed/demo.json`: about 35 new published posts.
  - `DemoSeeder` reuses the existing generated pictures for covers.
  - `DemoSeederIT` gets the new counts.
  - No API change, no migration, no change to `api/openapi.json`.
- **Design and docs.**
  - `design/system/components/` gets a Skeleton spec, and the header spec shows
    the theme switch.
  - `docs/DESIGN.md` (rule 3, Themes), `design/system/README.md` and
    `docs/ARCHITECTURE.md` ("no manual toggle") describe the switch. No ADR
    records the old rule, so none is superseded.
- **E2E.** The theme audit in `e2e/src/audit-accessibility.spec.ts` also checks
  the switch pins a theme across a reload.
- **Stories.**
  - US-13 (paginated feed, made demonstrable).
  - The shell items carry no user story; they are release polish (ROADMAP row).
- **Review findings.**
  - F-06 and F-08 become taken, then done.
  - F-01 becomes declined (owner, 2026-11-22).

## Plan updates absorbed

None. `docs/plan-updates/polish-release/` has no notes.
