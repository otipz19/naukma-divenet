# Tasks

## 1. Design system

- [ ] 1.1 Add `design/system/components/Dialog/` and `Toast/` (a README and a `preview.html` each) and their reference styles in `components/bundle.css`, using tokens only (`scrim`, `radius-lg`, `shadow-2`). Verify: `node design/build-tokens.mjs --check` passes and both previews open in `node design/serve.mjs`.
- [ ] 1.2 Update `design/screens/DiveLog.html`: the table at full width with Edit and Delete on each row, and a second screen with the Log a dive dialog open. Add `design/screens/Certificates.html` (list, plus the edit dialog). List the components and the screen in `docs/DESIGN.md`. Verify: the screens render in `node design/serve.mjs`.

## 2. Shared components

- [ ] 2.1 Add the `showModal`/`close` shim for `HTMLDialogElement` to `frontend/src/test/setup.ts` (design D1). Verify: an existing test run stays green.
- [ ] 2.2 Build `components/Dialog`: native `<dialog>` and `showModal()`, a titled `h2` as its name, a translated close button, `cancel` handled through `onClose`, no close on a backdrop click, focus returned to the opener, full screen below `bp-md`. Add Vitest tests for each `shared/dialogs` scenario that jsdom can reach (opened and named, Escape via `cancel`, close button, backdrop click ignored, focus return).
- [ ] 2.3 Add the `confirmClose` support to `Dialog`: a nested "Discard changes?" question with Discard and Keep editing, used when the form has unsaved changes (D3). Add Vitest tests for "Unsaved changes discarded", "Unsaved changes kept" and "No changes", including that Escape in the inner dialog does not close the outer one.
- [ ] 2.4 Build `components/ConfirmDialog` on `Dialog`: the question as its name, a confirm button (danger tone) and Cancel, focus starting on Cancel (D4). Add Vitest tests for "Confirmed", "Cancelled" and "Initial focus".
- [ ] 2.5 Build `components/Toast`: `ToastProvider`, `useToast().show({ title, body, link })` and `ToastRegion` (`role="status"`, a 6 s timer that pauses on hover and focus, a close button, stacking). Render the region once in `app/AppLayout.tsx`. Add Vitest tests with fake timers for each new `shared/app-shell` scenario.
- [ ] 2.6 Add the `en` and `uk` strings for the dialog, confirmation and toast (`common.dialog.*`, `common.toast.close`). Verify: the i18n parity step of `pnpm check`.

## 3. Dive log

- [ ] 3.1 Rework `DiveLogPage`, `DiveForm` and `DiveTable` (D6):
  - one dialog state;
  - Log a dive, `?site=` (opened once) and each row's Edit open `DiveForm` in a `Dialog` titled "Log a dive" or "Edit dive: <site>, <date>";
  - Delete on the row, through a `ConfirmDialog`;
  - remove the inline confirmation, `banner` and `focus`.

  Update `DiveLogPage.test.tsx` to cover every `divelog/log-page` scenario: no form on the page, site search, logged, form errors, failed save, site in the URL, not reopened, edit, delete, delete not confirmed, failed delete, and while editing.
- [ ] 3.2 Announce unlocked achievements with `useToast()` after the dialog closes: one toast per code, with a "See achievements" link to `/users/{id}`. Delete `UnlockedBanner`. Add tests for "A save earns one", "A save earns two", "A save earns nothing", "The next save" and "Link to achievements".
- [ ] 3.3 Add the `en` and `uk` strings (`divelog.dialog.editTitle`, `divelog.table.delete`, `divelog.table.deleteEntry`, `divelog.confirmDelete`, `achievement.seeAll`) and remove keys that are no longer used. Verify: the i18n parity step and `tsc` pass.

## 4. Certificates

- [ ] 4.1 Extract `CertificateForm` from `CertificatesPage` and open it in a `Dialog` from "Add a certificate" and each item's Edit. The title is "Add a certificate" or the certificate's title. The verified-edit warning sits inside the dialog. Delete uses a `ConfirmDialog`. Remove the inline confirmation and the phone scroll workaround. Update `Certificates.test.tsx` for every scenario of the modified requirement: signed out, listed, added, form errors, edit warning, delete, delete not confirmed, failed save.
- [ ] 4.2 Add the `en` and `uk` strings (`user.certificates.add`, `user.certificates.editTitle`, `user.certificates.confirmDelete`) and remove unused keys. Verify: the i18n parity step passes.

## 5. End-to-end and accessibility

- [ ] 5.1 Update `e2e/src/dive-achievement.spec.ts` to log the dives through the dialog (`getByRole("dialog", { name: "Log a dive" })`). It asserts that the dialog closes after a save, that both achievement toasts appear, and that Escape on an opened dialog returns focus to "Log a dive". Verify: `pnpm test:e2e` passes this journey.
- [ ] 5.2 Update `e2e/src/audit-accessibility.spec.ts`:
  - scan `/dive-log` with the Log a dive dialog open;
  - scan `/profile/certificates` with the Add a certificate dialog open, in both themes;
  - remove the scan of the non-existent `/dive-log/new`.

  Verify: `pnpm test:e2e` is green under the existing violation policy.
- [ ] 5.3 Check the dialogs by hand on the running stack at 1280×800 and 390×844, in both themes and in `uk`. Confirm the phone dialog is full screen and scrolls inside itself, and the toast does not cover the page's primary action. Take screenshots for the PR.

## 6. Finish

- [ ] 6.1 Set F-14, F-15, F-16 and F-17 to `taken: add-dialogs-and-toasts` in `docs/review-findings/` (index and files) when apply starts. Set them to `done` in the archive commit.
- [ ] 6.2 Run `pnpm check` from the repository root, and fix any failures without weakening a check.
- [ ] 6.3 Update `docs/ROADMAP.md` (the status of `add-dialogs-and-toasts`) and `docs/HANDOFF.yaml`.

## Workflow follow-up

- Sync the delta specs (`shared/dialogs`, `shared/app-shell`, `divelog/log-page`, `user/certificates`, `shared/accessibility`) into `openspec/specs/` and validate.
- Archive on `change/add-dialogs-and-toasts` with the roadmap status `archived`, then push and open the PR. Never archive after the merge.
