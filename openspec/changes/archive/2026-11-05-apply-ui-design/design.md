# Design: apply-ui-design

## Context

There are 12 mockups in `design/screens/`, 10 at 1280 px and 2 phone screens, one of which is dark and in Ukrainian. Features were checked against their own screen as they were built, mostly at desktop width in one theme and language. The tokens-only CSS check in the gate already rules out literal colours and pixel sizes, so what remains are layout, hierarchy, missing controls and phone ergonomics. An audit while proposing compared each mockup's headings, labels and buttons with the app's, and took screenshots of the map, site, dive log and profile pages.

## Goals / Non-Goals

Goals: every page matches its screen in both themes, at both widths and in both languages, or the difference is written down with a reason.

Non-goals: new features, copy changes beyond the disclaimer, the accessibility pass and empty states (`polish-release`).

## Decisions

### D1. The audit is a file, not a memory

`audit.md` in this change lists every screen and app page as rows, and the eight combinations (theme × width × language) as columns. Each cell is `ok`, a short finding with `fixed`, or `accepted: <reason>`. Screenshots are taken during apply but not committed, as they are large and go stale. The file is archived with the change.

Pages with no mockup follow their nearest screen and the components' READMEs: the certificates page, the post page, and the profile edit page.

### D2. One touch-target token

`touch-target` (44 px, `2.75rem`) joins the layout tokens in `tokens.json`. The Button and Chip modules apply it as `min-height` (and `min-width` for icon buttons) inside the existing `max-width: 767px` media query. Desktop sizes stay as designed. The map's Leaflet zoom control gets the same size through a global rule in the map module, as it is not our component.

### D3. Small behaviour, specced

The six changes in the specs change what a user can see or do, so each has a scenario and a Vitest test. Pure styling found by the audit (spacing, alignment, type classes) needs no spec, under AGENTS.md's rule for changes that alter no behaviour, and is tracked in `audit.md`.

- The dive log's header button reuses the page's existing start-over logic (`setEditing(null)` and a new form key), then focuses the site field.
- The profile stats move from `ProfileDives` into the header, which still hides them by the same privacy rule. `ProfileDives` keeps the visited sites and history.
- The disclaimer box gets its own `site.details.disclaimer` string in both locales. The footer keeps its label and lower-case continuation.

### D4. Accepted differences go into DESIGN.md

`docs/DESIGN.md` gets an "Accepted differences" section: the Warnings tab, the separate auth pages, and sample-only content. A later change then knows not to treat them as gaps. This is a design-doc change that the repository allows in the same PR.

## Risks / Trade-offs

- An audit is judgement. The file makes it reviewable, and the user reviews this proposal's findings first.
- Larger phone controls can wrap toolbars, such as the map's top bar. Each wrap is checked at 375 px in `uk`, the longest copy.

## Migration Plan

None; front-end only.

## Open Questions

None.
