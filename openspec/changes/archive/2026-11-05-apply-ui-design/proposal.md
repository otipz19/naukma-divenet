# Proposal: apply-ui-design

## Why

Every feature was built to its screen in `design/`, but each was checked mostly at 1280 px, in one language and one theme. The roadmap's first M6 item asks for one pass over every page against `docs/DESIGN.md`, in both themes, at phone width and in Ukrainian, so the product is consistent before the demo. A first audit while proposing this change, of all 12 mockups against the running app, already found real gaps.

## What Changes

- An audit record, `openspec/changes/apply-ui-design/audit.md`, kept with this change and archived with it. It covers every screen in light and dark, at 1280 px and 375 px, and in `en` and `uk`. Each difference is marked fixed, or accepted with a reason.
- Fixes for the gaps found so far:
  - **Touch targets:** buttons, chips and icon buttons are under 44 px on phones, against the design's accessibility rule. They get a `--touch-target` token that applies below `bp-md`.
  - **Dive log:** a Log a dive button in the header starts a new entry, as `DiveLog.html` does.
  - **Profile:** the dive statistics move into the profile header, as `Profile.html` draws them.
  - **Post editor:** the title field uses the display type, as `PostEditor.html` draws it.
  - **Submit a site:** a Cancel link back to the map.
  - **Ukrainian disclaimer:** the site page's disclaimer box starts with a lowercase letter in Ukrainian, because it reuses the footer text that follows a "Безпека:" label.
- Any further gap the full audit finds is fixed in this change when it is visual, or recorded as a plan-update note when it needs behaviour that no story asks for.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared/app-shell`: controls are large enough to touch on phones.
- `site/details`: the disclaimer box reads as a sentence in both languages.
- `site/submission`: the submission page offers Cancel.
- `divelog/log-page`: the header offers to log a new dive.
- `user/profile`: the header shows the dive statistics.
- `post/editor`: the title uses the display type.

## Impact

- Front-end only: CSS modules, a few components and pages, `en` and `uk` strings, and Vitest tests. No API, database or stack change.
- `design/system/tokens.json` gains `touch-target`, regenerating `tokens.css`.
- `docs/DESIGN.md` gains a short "Accepted differences" list, so later work does not reopen them.

## Out of scope

- The Moderation mockup's Warnings tab: accepted as a difference by the note from `add-site-warnings`.
- Sample content the product has no data for, such as a site's "Type: Wreck", a certificate's issue year, the "Wreck Explorer" and "Reviewer" achievements, and post cards' "6 min read" from sample text.
- Log in and Sign up on one page, as `Auth.html` shows them. The app keeps a page for each, which its auth spec describes.
- Copy, empty and error states, and the accessibility pass: `polish-release`. Demo data: `complete-demo-seed`.

## Plan updates absorbed

- `docs/plan-updates/apply-ui-design/add-site-warnings--no-warnings-moderation-tab.md`

## Plan updates written

None yet; the full audit may write some (see What Changes).
