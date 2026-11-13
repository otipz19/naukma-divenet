# Tasks

## 1. Audit infrastructure

- [ ] 1.1 Add `@axe-core/playwright` (pinned to match Playwright 1.65.0) to `e2e/package.json` and install.
- [ ] 1.2 Write `e2e/src/support/audit.ts`: the `expectAccessible` helper with the WCAG 2.1 A/AA tags, the impact split (critical/serious fail, moderate/minor report), and the accepted-exceptions map with the stale-exception check.

## 2. Audit specs

- [ ] 2.1 Write the audit specs covering every routed page: anonymous pages (map, catalog, site details, login, register), signed-in pages (dive log and entry form, achievements, post editor, feed, post page, review form, warning form, profile, gear locker, certificates in both states), admin moderation as admin — reached through the journey fixtures with seeded data.
- [ ] 2.2 Add the theme and locale scans per design D2 (default + dark theme per page; `uk` locale for pages with translated chrome).

## 3. Triage

- [ ] 3.1 Run the full audit suite against the seeded stack and collect the finding list.
- [ ] 3.2 Fix every finding that a rule demands with the smallest diff (labels, roles, markup, contrast tokens in `design/system`); re-run until those rules pass.
- [ ] 3.3 Move every remaining critical/serious finding to the accepted-exceptions list with a written reason and, where a flow change is the real fix, name the follow-up change; confirm the stale-exception check stays green.

## 4. Docs, spec sync, archive

- [ ] 4.1 Add one sentence on the audit to the README's testing section and update `docs/HANDOFF.yaml`.
- [ ] 4.2 Add the `audit-accessibility` row to `docs/ROADMAP.md` as in-progress at proposal time, flip it to archived when done.
- [ ] 4.3 Sync the `shared/accessibility` spec into `openspec/specs/`, validate everything with `openspec validate --all --strict`, run `pnpm check` and the full `pnpm test:e2e` end to end, and archive the change.
