# Design

## Context

The corpus is the public `modern-web-guidance` npm package (208 topic guides);
the auditor invokes it through a personally installed skill, but every command
is reproducible with plain `npx modern-web-guidance@latest`, and the ledger
pins the package version the verdicts were produced against (verified
operational: `search`, `retrieve`, `legacy-scan`). The corpus splits into a mechanical subset — 35 rules over 33 guides, covered by
`legacy-scan`, currently 0 findings — and a judgment-based majority that needs
topic-by-topic retrieval and human triage. This change runs that audit once,
produces a ledger, and applies the fixes triage demands.

## Goals and Non-Goals

Goals:

- A complete, dated ledger: scoped topic -> verdict (pass / fixed / accepted).
- The known `color-scheme` defect fixed.
- Findings fixed with the smallest diff a guide demands; everything else
  accepted with reasons, never silently skipped.

Non-goals: adopting features no guide requires of us (no view transitions or
passkeys "because the guide exists"); making `legacy-scan` a CI gate; auditing
`design/screens` mockups (they are reference material, the product is what
ships).

## Proposed Solution

**D1: the ledger is the artifact; the PR body carries its summary.**

The ledger lives in this change's design (moved to the archive on completion),
one line per scoped topic: guide id, what was checked (files/pages), verdict,
and the reason or diff reference. The PR body summarizes counts and the fixed
defects. A future re-audit re-runs the same topic list against a new corpus
version, so the ledger doubles as the repeatable method.

**D2: the color-scheme fix mirrors the token contract exactly.**

The generator emits `color-scheme` alongside the themed custom properties, so
native UI (scrollbars, form controls, canvas) always matches the active theme:

```
:root, [data-theme="light"]         { color-scheme: light; ... }
[data-theme="dark"]                 { color-scheme: dark;  ... }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"])   { color-scheme: dark;  ... }
}
```

The `<meta name="color-scheme" content="light dark">` already in
`frontend/index.html` keeps its role (initial canvas before CSS); the CSS
property takes over once styles load. The theme audit test in
`e2e/src/audit-accessibility.spec.ts` gains a computed-style assertion per
activation path, next to the token assertions it already makes.

**D3: per-topic method: retrieve, locate, verdict.**

For each scoped topic: `retrieve` the guide, identify the app surface it
applies to (from the feature map in the proposal), audit source and, where
runtime behavior matters, the rendered pages through the E2E dev stack, then
write the verdict. Guides that turn out to not apply after retrieval are
recorded as `n/a` with one line of why, not dropped silently — the scoped list
is a superset on purpose, so the ledger shows the scoping was deliberate.

**D4: triage rule.**

A guide requirement becomes a fix when it changes what the user experiences
and the diff is local (an attribute, a CSS property, a validation timing). It
becomes an accepted entry when it demands a flow or feature change, with the
hypothetical follow-up named. Anything where the guide itself marks a practice
OPTIONAL and the current behavior is correct stays a pass.

## Findings Ledger

Corpus: `modern-web-guidance@latest`, skill version `2026_11_09-5bcc021b`.
`legacy-scan frontend/src`: 0 findings across 35 rules (33 guides).

### Batch: forms (retrieved and audited before the PR)

- `forms` — **fixed (planned)**. Two violations of DO requirements:
  (1) "DO provide an accessible toggle `<button type="button">` with
  `aria-pressed` allowing users to unmask password input" — the login and
  register password fields have no unmask control.
  (2) "DO turn off text correction on fields that hold identifiers rather than
  prose: `autocorrect="off"` (plus `autocapitalize="none"` and
  `spellcheck="false"`) on usernames, emails" — the email fields carry only
  `type="email"` and `autocomplete`.
- `forms` (native constraints) — **accepted**. Requirement: "DO use native
  constraints: `required`, `minlength`, `maxlength`, `pattern`." Validation is
  handled by react-hook-form schemas (zod) with inline, translated error
  text tied to each field via `aria-invalid`/`aria-describedby`; adding
  native constraints would surface browser bubbles alongside the app's error
  UI for the same field. The guide's own scale ("Client-side validation is
  for User Experience") is satisfied; timing verified below. Follow-up: none
  planned.
- `validate-input-after-interaction` — **pass**. The guide's timing matrix
  ("Validate on blur... and reset error states on input") is met by the
  react-hook-form defaults: errors appear only after a submit attempt
  (`mode: onSubmit`) and clear as the value is corrected (`reValidateMode:
  onChange`). Error text is not color-only and `aria-invalid` is set while
  the field is in error (`TextField`).
- `autofill-sign-in-form` — **pass**. `autocomplete="email"` +
  `current-password` (login) and `new-password` (register) are set correctly;
  pasting is not blocked anywhere in the auth forms.
- `required-field-feedback`, `accessible-error-announcement`,
  `ime-safe-enter-submit` — **pass (pending runtime spot-check)**. No custom
  Enter handlers exist in any form (IME composition is handled by the native
  form semantics); `aria-invalid` is synchronized with the visible error text.
  Runtime confirmation rides the existing form journeys.

## Risks and Trade-offs

- **The corpus moves under us.** The ledger pins the npm package version the
  verdicts were produced against; re-auditing is a re-run against the new
  version, not a redesign.
- **Judgment-based findings can be wrong.** Every accepted or fixed entry
  cites the guide's own requirement text, not a paraphrase, so a reviewer can
  disagree with the corpus rather than with our reading of it.
- **Suite time.** Runtime spot-checks reuse the existing E2E stack and specs;
  the ledger prefers source-level verification where behavior is already
  covered by a journey or the audits.

## Migration Plan

Apply in one change: ledger topics audited in batches (forms, theming,
security, media, lists, dates, SPA, cross-checks), fixes committed as they are
verified, ledger finalized, docs updated, archive.

## Open Questions

None.
