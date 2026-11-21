# Proposal

## Why

In the product review (2026-11-21, `docs/review-findings`, F-14 to F-17) the owner found
two problems on the dive log and certificates pages. Edit does not show that the form now
holds an existing entry. Delete is hidden inside that form. The achievement announcement
appears inside the form. All three come from one pattern: a form that stays open beside
the list and is reused for editing. The design system has no Dialog and no Toast to
replace it with. The next item, `rework-map-page`, needs the Dialog for its first-visit
disclaimer (F-03), so it is built here, once.

## What Changes

- **Dialog** in the design system and the front-end: a modal built on the native
  `<dialog>` with `showModal()`. It has a title, closes on Escape and on its close button,
  sends focus back to the control that opened it, and is full-screen on a phone. A small
  **confirmation dialog** is built on it ("Delete the dive at SS Thistlegorm on 12 Mar
  2026?").
- **Toast** in the design system, plus one **toast region** in the app shell. A toast is a
  `role="status"` live region in a corner. It closes on its own after about 6 s or on its
  close button, and its timer pauses while it is hovered or focused.
- **Dive log (F-14, F-15, F-16):**
  - The table is the page; the form beside it is removed.
  - "Log a dive" in the page header, `/dive-log?site={id}` and each row's Edit open the
    form in a dialog. Its title says which: "Log a dive", or "Edit dive: <site>, <date>".
  - Closing a dialog that has unsaved changes asks first.
  - Each row gets a Delete action, with a confirmation dialog that names the entry.
  - An unlocked achievement is announced in a toast with a link to the user's
    achievements, instead of an alert inside the form.
- **Certificates (F-17):**
  - The list is the page, with "Add a certificate" above it.
  - Add and each item's Edit open the form in a dialog whose title names the certificate.
  - Delete stays on the item and is confirmed in a dialog.
  - Editing a verified certificate shows the "needs verifying again" warning in the
    dialog before saving.
- Design: update `design/screens/DiveLog.html`. Add a `Certificates.html` mockup and the
  Dialog and Toast component specs in `design/system/components/`. List them in
  `docs/DESIGN.md`.
- The E2E journey and the accessibility audits run against the dialogs: the dive log
  and certificate dialogs are scanned while open.

Stories: US-09 (dive log), US-10 (achievements, the unlock announcement), US-C1
(certificates).

Out of scope:
- Toasts for achievements earned from a post or an approved site (F-14 leaves them out).
- The gear locker and profile edit. The gear locker only adds and removes items, and
  profile edit is a page of its own; neither reuses a form for editing, so the pattern
  does not apply.
- The NavDrawer stays as it is: it is a drawer, not a centred dialog.
- No API, database or back-end change.

## Capabilities

### New Capabilities
- `shared/dialogs`: how a modal dialog and a confirmation dialog behave everywhere in the
  app: opening, title, closing (Escape, close button, unsaved changes), focus, and phone
  layout.

### Modified Capabilities
- `shared/app-shell`: adds a toast region that every page can use, and the toast's
  behaviour.
- `divelog/log-page`: the form moves into a dialog opened from the header, the URL and
  each row; Delete moves to the row; the achievement announcement becomes a toast.
- `user/certificates`: the certificates page adds and edits in a dialog, and confirms
  Delete in one.
- `shared/accessibility`: the audit also scans dialogs while they are open.

## Plan updates absorbed

None (`docs/plan-updates/add-dialogs-and-toasts/` does not exist).

## Impact

- Front-end only:
  - new `components/Dialog`, `components/ConfirmDialog` and `components/Toast` with
    their tests;
  - a toast provider in `app/AppLayout.tsx`;
  - `features/divelog/DiveLogPage.tsx`, `DiveForm.tsx`, `DiveTable.tsx`;
  - `features/user/CertificatesPage.tsx`;
  - `features/achievement/UnlockedBanner.tsx` is replaced by a toast;
  - `en`/`uk` locale strings.
- Test setup: jsdom has no `showModal()`, so `src/test/setup.ts` gains a small shim, and
  the native behaviour is checked in Playwright.
- E2E: `dive-achievement.spec.ts` and `audit-accessibility.spec.ts`. The latter also
  drops its scan of `/dive-log/new`, a route that does not exist.
- Design: `design/system/components/Dialog`, `Toast`, `bundle.css`,
  `design/screens/DiveLog.html`, a new `design/screens/Certificates.html`, and
  `docs/DESIGN.md`.
- No departure from `docs/ARCHITECTURE.md`; no ADR.
