# Proposal

## Why

The product's quality gates cover behavior, accessibility, load, front-end
performance and vulnerabilities, but nothing checks whether the web platform
itself is used the way current guidance recommends. The `modern-web-guidance`
corpus (208 topic guides, Google Chrome's curated best practices, runnable by
anyone through its pinned npm package) is the reference; a mechanical
`legacy-scan` over `frontend/src` already passes
(0 findings across 35 rules), but most of the corpus is judgment-based: it
needs a human-shaped audit per topic, triaged like the accessibility audits
were. One defect is already known from a first pass: the CSS `color-scheme`
property is never set, so native controls and scrollbars stay light-themed in
dark mode even though the tokens switch.

## What Changes

- A findings ledger in the change's design: every scoped topic gets a verdict —
  pass, fixed (with the diff), or accepted (with a written reason) — produced by
  retrieving the guide and auditing the relevant source and rendered pages.
- Scoped topics, mapped to app features: forms and validation feedback
  (`forms`, `validate-input-after-interaction`, `required-field-feedback`,
  `accessible-error-announcement`, `ime-safe-enter-submit`,
  `autofill-sign-in-form`, `brand-consistent-forms`), theming
  (`dark-mode`, `browser-ui-theming`, `color-scheme` fix), user content and
  security (`sanitize-untrusted-html`, `validate-origins`,
  `secure-external-subresources`), media (`optimize-image-priority`,
  `deliver-optimized-decorative-images`, `lazy-load-video-and-audio`),
  lists and overlays (`responsive-table`, `sortable-table`, `dialog`,
  `light-dismiss-a-dialog`, `persistent-toast-notifications`), dates and i18n
  (`calculate-event-differentials`, `sort-high-precision-timestamps`), SPA
  behavior (`faster-spa-view-transitions`, `scroll-target-on-load`), and
  cross-checks of finished work (`accessibility`, `color`, `typography`,
  `respect-os-text-scale`, `performance`).
- Fixes applied where a guide demands them; the known `color-scheme` defect
  (native controls stay light in dark mode) is the first one.
- `legacy-scan` stays at 0 findings as the mechanical regression net; the
  ledger records the corpus version audited.
- A roadmap row `audit-modern-web` (M6), this proposal being the item that
  adds it.

Out of scope: topics for features the app does not have (passkeys, web
components, iframes, 3D/WebGL, analytics batching, agentic integrations),
and any guide-mandated change that alters product behavior beyond what the
guide requires (those become accepted entries with the follow-up named).

## Capabilities

### New Capabilities

- `shared/modern-web`: the web-platform usage audit method and its standing
  requirements: the guidance corpus is consulted per topic, findings are
  triaged into fixed or accepted with reasons, and the mechanical legacy scan
  stays clean.

### Modified Capabilities

None.

## Impact

- Product fixes where triage lands on defects: first the `color-scheme`
  declaration (generator + tokens), then whatever else the ledger surfaces
  (expected areas: form validation feedback timing, autocomplete attributes,
  user-content rendering).
- `docs/HANDOFF.yaml` and the README testing section updated.
- No CI workflow changes: `legacy-scan` runs locally/on demand; adding it as a
  gate is a separate decision if the corpus keeps growing.
- No new dependencies.

## Plan updates absorbed

None.
