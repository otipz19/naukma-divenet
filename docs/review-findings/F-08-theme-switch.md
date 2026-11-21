# F-08 No theme switch

- **Area:** App shell
- **Status:** decided (owner, 2026-11-21: add the switch)
- **Delivered by:** `polish-release`

## Seen
The header has no dark/light switch. The theme changes only with the OS setting.

## Cause
Spec `shared/app-shell` ("The colour theme follows the system preference") defines
only the system-driven theme. The ROADMAP row for `add-app-shell` lists a
"theme switch", but the archived spec never included one, so the roadmap and the
spec disagree.

## Fix
A three-way control in the header and the phone drawer: System, Light, Dark. It sets
`data-theme` on `<html>`; System removes the override. The choice is remembered in
`localStorage`. The token CSS already supports both paths (the `prefers-color-scheme`
media query and the `data-theme` attribute, from `audit-accessibility`), so this is
mostly a UI addition. Spec change: add a requirement for the switch; keep the system
default. The a11y audit covers both forced themes already.
