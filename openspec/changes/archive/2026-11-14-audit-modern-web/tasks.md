# Tasks

## 1. Theming (the known defect)

- [x] 1.1 Extend `design/build-tokens.mjs` to emit `color-scheme` per theme on the same selectors as the custom properties (attribute path and media path), regenerate `tokens.css`.
- [x] 1.2 Extend the theme contract test with a computed `color-scheme` assertion per activation path (attribute-pinned light over OS dark, attribute dark, media path without attribute).

## 2. Forms and validation feedback

- [x] 2.1 Audit `forms`, `validate-input-after-interaction`, `required-field-feedback`, `accessible-error-announcement`, `ime-safe-enter-submit`, `select-menu-interaction` against the login, register, review, warning, dive-log and site-submission forms; write ledger verdicts.
- [x] 2.2 Audit `autofill-sign-in-form`, `autofill-address-form`, `brand-consistent-forms` (autocomplete attributes, native control theming); fix what the guides demand (expected: autocomplete attributes on the login form); write verdicts.

## 3. User content and security

- [x] 3.1 Audit `sanitize-untrusted-html`, `validate-origins`, `secure-external-subresources` against how reviews, posts, warnings and names are rendered and where external resources are loaded; fix or accept with quoted requirements.

## 4. Media

- [x] 4.1 Audit `optimize-image-priority`, `deliver-optimized-decorative-images`, `lazy-load-video-and-audio` against the feed images, avatars, photo previews and video attachments; cross-check against the Lighthouse page-weight findings; fix or accept.

## 5. Lists, overlays, SPA behavior

- [x] 5.1 Audit `responsive-table`, `sortable-table`, `dialog`, `light-dismiss-a-dialog`, `persistent-toast-notifications` against the moderation queue, MUI dialogs and the achievement banner; fix or accept.
- [x] 5.2 Audit `faster-spa-view-transitions`, `scroll-target-on-load`, `calculate-event-differentials`, `sort-high-precision-timestamps` against the router, scroll restoration and relative-date rendering; fix or accept.

## 6. Cross-checks of finished work

- [x] 6.1 Audit `accessibility`, `color`, `typography`, `respect-os-text-scale`, `performance` against the already-gated work; record pass or follow-up verdicts.

## 7. Ledger, docs, sync, archive

- [x] 7.1 Finalize the ledger in the change design (all scoped topics verdicted, corpus version recorded); keep `legacy-scan` at 0 findings.
- [x] 7.2 Document the audit method in the README testing section and update `docs/HANDOFF.yaml`; add the `audit-modern-web` roadmap row as in-progress at proposal time, flip to archived when done.
- [x] 7.3 Sync the `shared/modern-web` spec into `openspec/specs/`, validate everything with `openspec validate --all --strict`, run `pnpm check` and the full `pnpm test:e2e`, and archive the change.
