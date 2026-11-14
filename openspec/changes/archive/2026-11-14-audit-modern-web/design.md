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

### Batch: theming (retrieved before the PR)

- `dark-mode` / `browser-ui-theming` — **fixed**. Requirement: "MANDATORY:
  Apply the `color-scheme` property to the `html` element or the `:root`
  pseudo-class." The property was never set in CSS (only the meta tag
  existed), so scrollbars, form controls and the canvas stayed light-themed
  in dark mode. The generator now emits `color-scheme: light` / `dark` on the
  same selectors as the themed tokens (attribute and media paths), and the
  theme contract test asserts the computed value per path.

### Batch: user content and security

- `sanitize-untrusted-html` — **pass**. No `dangerouslySetInnerHTML` or
  `innerHTML` exists in product code; all user content (reviews, posts,
  warnings, names) renders as React text nodes, which the framework escapes.
  There is no HTML-injection surface to sanitize.
- `validate-origins` — **pass**. The client talks only to the same origin
  (`/api/v1` through the web server's proxy); no cross-origin API calls.
- `secure-external-subresources` — **fixed**. The single external subresource
  (OSM tiles, `https://tile.openstreetmap.org`) is fetched over HTTPS but was
  blocked by the CSP shipped in `harden-security`
  (`img-src 'self' data: blob:`). The tile host is now allowed explicitly in
  all three CSP locations, and the map audit waits for a loaded tile
  (`.leaflet-tile-loaded`), so a blocked map can never pass again.

### Batch: media

- `optimize-image-priority` — **fixed**. The post page cover (the LCP
  candidate) now carries `fetchpriority="high"`; feed and post-card covers
  are below the fold and carry `loading="lazy"`.
- `deliver-optimized-decorative-images` — **accepted**. Requirement context:
  the guide wants intrinsic `width`/`height` to prevent layout shift and
  multi-format `srcset`. Dimensions live in the media store and are not part
  of the current API responses; the Lighthouse runs show no CLS-driven
  failures. Follow-up: add image dimensions to the media API responses.
- `lazy-load-video-and-audio` — **pass**. Video attachments render with
  `controls` and `preload="metadata"` (no eager download); the upload fields
  only preview locally selected files.

### Batch: lists, overlays

- `responsive-table`, `sortable-table` — **n/a**. The moderation queue and
  admin lists are card/row lists, not `<table>` elements; no tabular data is
  rendered client-side.
- `dialog`, `light-dismiss-a-dialog` — **n/a**. The product renders no
  dialogs today; confirmation flows are inline.
- `persistent-toast-notifications` — **pass**. The achievement banner is a
  transient live-region Alert (aria-live), announced and dismissible; no
  focus is trapped.

### Batch: SPA behavior and dates

- `faster-spa-view-transitions` — **accepted**. The guide's
  `content-visibility: hidden` view caching targets tabbed shells with a
  small, predictable view count and demands an eviction strategy for dynamic
  apps. Divenet's routes are distinct data-fetching pages; adopting the
  pattern is a flow change, not a required fix. Follow-up: none planned.
- `scroll-target-on-load` — **n/a**. No hash targets or initial-load scroll
  positions exist; the feed scrolls to top on pagination by design.
- `calculate-event-differentials`, `sort-high-precision-timestamps` — **n/a**.
  The client renders absolute dates through `Intl.DateTimeFormat` with the
  active locale and performs no timestamp arithmetic; ordering happens
  server-side.

### Batch: cross-checks

- `accessibility` — **pass**. The prose guide's core requirements are already
  enforced by the axe audits (semantic forms, labeled controls,
  `:focus-visible` outline in `global.css`, the canonical visually-hidden
  recipe on the map heading, no `aria-label` overriding visible text).
- `color` — **pass**. Semantic token system with light/dark pairs; contrast
  is axe-audited in both themes (the one failure found is fixed in this
  change's sibling work).
- `typography` — **fixed**. Requirement: "DON'T use `px` for font-size.
  Prefer `rem` to honor the user's browser font-size preferences." The
  generated type scale now converts px to rem.
- `respect-os-text-scale` — **fixed** by the same conversion (rem type scale
  scales with the root preference; no root font-size override exists —
  verified).
- `performance` — **pass**. The image-priority fixes above are the guide's
  LCP-relevant items; the k6/Lighthouse gates keep the measured side honest.

## Risks and Trade-offs

- `forms` — **fixed**. Two violations of DO requirements:
  (1) "DO provide an accessible toggle `<button type="button">` with
  `aria-pressed` allowing users to unmask password input" — fixed by the new
  `components/PasswordField` (toggle button with `aria-pressed`, icon + text,
  en and uk strings), used by the login and register forms.
  (2) "DO turn off text correction on fields that hold identifiers rather than
  prose: `autocorrect="off"` (plus `autocapitalize="none"` and
  `spellcheck="false"`) on usernames, emails" — fixed by those attributes on
  the email fields of both auth forms.
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
  `ime-safe-enter-submit` — **pass**. No custom
  Enter handlers exist in any form (IME composition is handled by the native
  form semantics); `aria-invalid` is synchronized with the visible error text.
  Runtime confirmation: the full E2E suite (16/16) exercises every form
  end to end after the fixes — login, register, review, warning, dive log
  and site submission.

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
