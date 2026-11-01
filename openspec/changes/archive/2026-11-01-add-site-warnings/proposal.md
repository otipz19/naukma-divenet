# Proposal

## Why

A site page tells divers what a site is like on average, but not what changed last week: a
strong current on the mooring line, an incident, poor visibility after a storm. US-S1 asks for
warnings that divers post and read at the top of the site page, so others dive safely. It is
the last M2 item; the site catalog and authentication it depends on are archived.

## What Changes

- New `warning` back-end feature: a `warnings` table with the site, the author, a type
  (`HAZARD`, `INCIDENT`, `CHANGED_CONDITIONS`, `MARINE_LIFE`, the four types in
  `design/system/components/Alert`), text up to 1000 characters, created and updated times, and
  when and by whom an admin hid it.
- REST endpoints: list a site's visible warnings (paged, newest first), read one warning,
  post a warning to an approved site (signed in), edit and delete one's own warning, and hide a
  warning (admins). A hidden warning disappears from every read and can no longer be edited.
- Site page: a "Recent warnings" section above "About this site", as in
  `design/screens/Site.html`: the two newest warnings as Alerts (danger for hazard and incident,
  caution for changed conditions and marine life) titled with type, how long ago and the
  author; "Show all warnings (n)" reveals the rest; a "Report a warning" button. The author's
  own warnings have Edit and Delete; admins see Hide on every warning. Delete and Hide ask for
  confirmation.
- Warning form page at `/sites/:id/warnings/new` and `/sites/:id/warnings/:warningId/edit`
  (signed in): a type select and a text area. There is no mockup for it; it reuses the form
  layout and components of the review form.
- en and uk strings for all of it.

Stories: **US-S1** (site warnings).

Out of scope or deferred:
- The "Warnings" tab of `design/screens/Moderation.html`. Warnings are published at once, so
  there is no queue to work through; admins hide from the site page. A tab that lists reported
  warnings needs a reporting feature that no story asks for. A note for `apply-ui-design`
  records that the tab is intentionally not built.
- Un-hiding a warning, and showing hidden warnings to admins: the row is kept, but no endpoint
  reads it back.
- Expiry of old warnings: every visible warning stays listed, newest first.
- Linking a warning's author to their profile: profiles do not exist yet. A note for
  `add-diver-profile` records this, as `add-site-reviews` did for review authors.
- Demo warnings: `complete-demo-seed` already covers them.
- Real-time push of new warnings (out of scope in PRODUCT.md).

No departure from `docs/ARCHITECTURE.md`: `warning` depends on `site` and `user` through their
services and entities; neither depends on `warning`. The paged list takes a `Pageable`, as the
conventions ask for a fixed order.

## Capabilities

### New Capabilities

- `warning/warnings`: the warning API: post, read, list, edit, delete, hide; validation,
  ownership, approved sites only, hidden warnings.
- `warning/site-warnings`: the "Recent warnings" section of the site page, with the own
  warnings' edit and delete and the admins' hide.
- `warning/warning-form`: the page that posts and edits a warning.

### Modified Capabilities

None. The site page gains a section, which `warning/site-warnings` specifies in full, as
`review/site-reviews` does for reviews; no requirement of `site/details` changes.

## Plan updates absorbed

None. `docs/plan-updates/add-site-warnings/` has no notes.

Notes written by this change (committed with the proposal):
- `docs/plan-updates/add-diver-profile/add-site-warnings--warning-author-link.md` (add-scope):
  link warning author names on the site page to the profile.
- `docs/plan-updates/apply-ui-design/add-site-warnings--no-warnings-moderation-tab.md`
  (constraint): the Moderation page's Warnings tab is intentionally not built; do not treat it
  as a gap.

## Impact

- Back-end: new package `ua.ukma.divenet.warning` (web, service, domain); Flyway
  `V10__create_warnings.sql`. `site` gains nothing: `warning` uses
  `SiteCatalogService.site(...)` to check the site exists and is approved.
- API: new warning endpoints, additive only. `api/openapi.json` and
  `frontend/src/api/schema.gen.ts` regenerated.
- Front-end: `src/features/warning/` (site section, form page, routes, api hooks), a change to
  `SitePage` to place the section, the router; en/uk locale keys under `warning.*`.
- Docs: ARCHITECTURE.md data-model sentence and diagram (`warnings` exists, `users` post
  warnings), ROADMAP.md status.
