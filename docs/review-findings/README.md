# Product review findings

Findings from the project owner's hands-on walkthrough of the running stack. There is
one file per finding (`F-NN-<slug>.md`), and this index lists them all.

Each finding names its cause and a proposed fix, and says which change should deliver
it. Fixes that change behaviour go through OpenSpec as usual. A pure styling or tooling
fix can go in a `fix/<topic>` branch. When a change takes a finding, set its status to
`taken: <change-id>`. When the change is merged, set it to `done: <change-id or PR>`.

Status values: `open` (no fix chosen yet), `decided` (fix agreed, not built),
`taken: <change-id>`, `done: <ref>`, `declined` (with the reason in the file).

## Findings

| ID | Area | Finding | Kind | Status |
| --- | --- | --- | --- | --- |
| [F-01](F-01-refresh-401.md) | Auth | Signed-out visit logs a 401 from `/auth/refresh` | cosmetic | decided |
| [F-02](F-02-font-csp.md) | Fonts / CSP | Inlined font subsets blocked by the CSP; `ґ` and `₴` in headings fall back to a system font | bug | decided |
| [F-03](F-03-footer-modal.md) | Shell | Footer makes the map page scroll; owner decided: remove the footer, show the disclaimer in a first-visit modal | spec change | decided |
| [F-04](F-04-password-width.md) | Auth UI | Password field narrower than the email field | bug | decided |
| [F-05](F-05-checks-missed-ui.md) | Tests | No check catches console errors, page overflow or layout drift | test gap | declined |
| [F-06](F-06-feed-paging-invisible.md) | Feed | Paging exists but never shows: 10 published posts, page size 20; seed more posts | demo gap | decided |
| [F-07](F-07-feed-card-width.md) | Feed | Cards fill a 720 px column on the left, leaving the right side empty for visitors | design question | declined |
| [F-08](F-08-theme-switch.md) | Shell | No theme switch; the theme only follows the system | spec gap | decided |
| [F-09](F-09-guest-actions.md) | Auth UX | Visitors see actions (review, warning, log a dive) they must sign in to use | design question | declined |
| [F-10](F-10-map-panel-desktop.md) | Map | Filters always expanded on desktop; the result count and list sit below the fold | UX | decided |
| [F-11](F-11-submit-site-placement.md) | Map | "Submit a site" sits inside the search form | UX | decided |
| [F-12](F-12-map-mobile.md) | Map | Phone map page scrolls and the form covers the map; it departs from `MobileMap.html` | UX / design drift | decided |
| [F-13](F-13-dive-form-errors-layout.md) | Dive log | Validation messages break the dive form layout; reproduce and find the cause before fixing | bug | decided |
| [F-14](F-14-achievement-toast.md) | Achievements | Unlock alert shows inside the form; use a toast | UX, spec change | decided |
| [F-15](F-15-dive-form-dialog.md) | Dive log | Edit is not obvious; create and edit move to a dialog | UX, spec change | decided |
| [F-16](F-16-dive-delete-hidden.md) | Dive log | Delete is only inside the edit form; users cannot find it | UX, spec change | decided |
| [F-17](F-17-certificate-form-dialog.md) | Certificates | Edit is unclear; create and edit move to a dialog | UX, spec change | decided |
| [F-18](F-18-admin-is-not-a-diver.md) | Roles | The admin can log dives, write posts and has a profile; the admin should be a moderator only | product rule, spec change | decided |
| [F-19](F-19-moderation-in-header.md) | Shell | Moderation link is in the account menu; move it to the header navigation | UX, spec change | decided |

## Proposed grouping into changes

| Change | Findings | Why together |
| --- | --- | --- |
| `fix/ui-defects` (no behaviour change) | F-02, F-04, F-13 | Small CSS and build fixes |
| `add-dialogs-and-toasts` (new roadmap item) | F-14, F-15, F-16, F-17 | One shared Dialog and Toast in the design system and the app shell, then the dive log and certificates moved onto them |
| `rework-map-page` (new roadmap item) | F-03, F-10, F-11, F-12 | They all change one screen's layout, and F-03 changes the shell that screen sits in |
| `polish-release` (planned) | F-01, F-06, F-08 | Release polish across pages |
| `scope-admin-account` (new roadmap item) | F-18, F-19 | One role rule across UI, API and specs; the header entry is part of the admin's new shell |

The owner agreed to this grouping on 2026-11-21. `add-dialogs-and-toasts`,
`scope-admin-account` and `rework-map-page` are rows in [ROADMAP.md](../ROADMAP.md)
(M6), in that order. F-03's disclaimer dialog reuses the shared Dialog, and both later
items change the app shell, so they run one after the other. The `polish-release` row
names its findings. `fix/ui-defects` needs no roadmap row: it changes no behaviour.

## Cross-cutting notes

- **The design system has no Dialog and no Toast** (`design/system/components/` holds
  Alert, AppFooter, AppHeader, Badge, Button, Chip, Cover, Rating, SiteCard and
  TextField). F-03, F-14, F-15, F-16 and F-17 all need them, so they are built once,
  first.
- **"Form beside the list, reused for edit"** is a repeated pattern: the dive log
  and certificates use it, and the gear locker and profile edit may too. Whatever is
  decided for F-15/F-17 applies to each of them.

## Review principles (owner, 2026-11-21)

- The goal is a convincing demo: review, then fix. Do not add new automated
  check suites now (F-05). Fixes still carry the tests the gate requires.
- Decisions are recorded here first. Implementation starts only when the owner asks.
- The review is closed (2026-11-21). Every finding is decided or declined, and every
  flow the owner did not comment on is accepted as it is.
- A bug fix starts by reproducing the bug on the running stack and naming its real
  cause, never by applying a guessed fix (F-13).
