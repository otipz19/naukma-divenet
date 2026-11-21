# Design

## Context

See `proposal.md` (Why). Current state:

- `DiveLogPage.tsx` renders `DiveTable` and a `DiveForm` that is always mounted. A `formKey`
  remounts the form on Edit or "Log a dive", and a `focus` prop moves focus into it.
- Delete confirmation is inline inside `DiveForm`, and the achievement `UnlockedBanner` is passed
  into the form as `banner`.
- `CertificatesPage.tsx` has the same structure. Its inline confirmation is keyed by
  `confirming` (the certificate id).
- The only overlay in the app is `NavDrawer`: a hand-written modal with a focus trap, not a
  `<dialog>`, because jsdom 30 has no `showModal()` (checked: `typeof showModal` is
  `undefined`).
- The modern-web audit (`audit-modern-web`) marked `dialog` as n/a ("no dialogs today") and
  `persistent-toast-notifications` as passed by the inline banner. Both verdicts change with this
  change.
- Both forms use react-hook-form, whose `formState.isDirty` gives the "unsaved changes" signal.

## Goals / Non-Goals

**Goals:**
- One `Dialog`, one `ConfirmDialog` and one toast API that later items reuse:
  - F-03's disclaimer in `rework-map-page`;
  - possibly "Review published" or "Post saved" toasts later.
- Native platform behaviour (top layer, inert background, Escape) instead of re-implementing it.

**Non-Goals:**
- Changing `NavDrawer`.
- A general notification centre or toast persistence across reloads.
- Back-end or API changes.

## Decisions

### D1. Native `<dialog>` with `showModal()`, shimmed in jsdom
`components/Dialog` renders a `<dialog>` with `aria-labelledby` on its `h2` title and a close
button (`lucide` `x`, translated `aria-label`). It calls `showModal()` when it mounts and
`close()` when it unmounts. The consumer controls it by rendering it or not, so dialog state is
plain React state on the page.

`showModal()` gives the top layer, an inert background (focus stays inside without a
hand-written trap), and Escape through the `cancel` event. The component:
- intercepts `cancel` with `preventDefault()` and calls the consumer's `onClose`, so the
  unsaved-changes check (D3) can veto the close;
- restores focus on unmount to the element that was active when it opened, because React
  unmounting a `<dialog>` does not do this reliably;
- ignores backdrop clicks, as the spec requires (a form could lose its data).

Alternative: copy NavDrawer's hand-written trap. It was rejected because it re-implements
inertness badly: content behind it stays clickable to screen readers.

Testing:
- `src/test/setup.ts` adds a minimal `HTMLDialogElement.prototype.showModal`/`close` shim. It
  sets and removes `open`, and `close` fires a `close` event.
- Vitest tests fire `cancel` themselves to simulate Escape.
- Real inertness, Escape and focus return are asserted in Playwright, in the dive log journey
  and the accessibility suite.

### D2. Full-screen below `bp-md`, `reading-max` wide above
Dialog CSS uses tokens only:
- `radius-lg`, `shadow-2`, `surface-1`;
- a `::backdrop` in the existing `scrim` token ("Overlay behind dialogs and the mobile
  navigation drawer"), so no new token is needed.

Below `bp-md` the dialog takes `inset: 0` and the full height, with no radius. The body scrolls
inside the dialog, and the title row and the actions row stay put (sticky). Motion: a 150 ms
fade, removed under `prefers-reduced-motion`.

### D3. Unsaved changes: `Dialog` takes a `confirmClose` callback
Form dialogs pass the form's `isDirty`. When `isDirty` is set and a close is requested
(Escape, the close button or Cancel), the dialog opens a nested `ConfirmDialog`: "Discard
changes?", with "Discard" and "Keep editing". A nested `showModal()` stacks correctly in the top
layer. Save closes the dialog without asking.

### D4. `ConfirmDialog` built on `Dialog`
`ConfirmDialog` props: `question`, `confirmLabel`, `onConfirm`, `onCancel`, `tone` (`danger` for
Delete). Focus starts on Cancel (`autoFocus`), so Enter never deletes by accident. Its question is
also its accessible name.

The dive question uses the row's site and its formatted date. The certificate question uses
`certificateTitle(...)`. The inline confirm UI in `DiveForm` and `CertificatesPage` is removed.

### D5. Toasts: a provider in the shell, `useToast()` in pages
`components/Toast` has:
- a `ToastProvider` with a context exposing `show({ title?, body?, link? })`;
- a `ToastRegion` rendered once in `AppLayout`, outside `<main>`.

The region is a fixed stack in the bottom-right corner on desktop, and full width at the bottom
below `bp-md`. It is a single `role="status"` container, so each added toast is announced
politely.

Each toast:
- runs its own 6 s timer, paused on `pointerenter` and `focusin` and restarted on
  `pointerleave` and `focusout`;
- has a close button.

Toasts are not portalled into the top layer. They are shown after a dialog closes (the
achievement toast follows a successful save, which closes the dialog), so a modal never covers
them. This is recorded as a constraint in the component README.

Alternative: a `popover="manual"` region in the top layer. It was rejected for now: jsdom has no
popover API either, and no current toast fires while a modal is open.

### D6. The dive log page state
`DiveLogPage` holds one state value:

```ts
dialog: { kind: "new"; site: Picked | null } | { kind: "edit"; entry } | { kind: "delete"; entry } | null
```

- `?site=` sets `{ kind: "new", site }` once, after the site query resolves to an approved site.
  A ref records that it was used, so it is never reopened. The URL is left as it is.
- `DiveForm` drops its `banner`, `focus` and delete props. The dialog's initial focus goes to the
  site field (`autoFocus`) for a new dive, and to the first field for an edit.
- On save, the page closes the dialog and then runs `announceUnlocked()`, the existing
  before/after diff from add-achievements D5. It calls `toast.show()` once per new code, with the
  link `/users/{id}` ("See achievements").
- `UnlockedBanner` is deleted.
- `DiveTable` gains `onDelete` next to `onEdit`. Both are `ghost` `sm` buttons, with accessible
  names "Edit dive at <site>, <date>" and "Delete dive at <site>, <date>". On a phone they keep
  the 44 px touch target (`touchTarget.test.ts`).

### D7. The certificates page
The certificates page uses the same state shape: `new`, `edit` and `delete`. Pieces:
- an "Add a certificate" primary button above the list;
- `CertificateForm` (extracted from the page) inside a `Dialog`;
- the verified-edit warning `Alert` at the top of the edit dialog;
- Delete on each item, opening a `ConfirmDialog`.

The workaround that scrolls the form into view on a phone is removed.

### D8. i18n
New keys in the existing namespaces, all in `en` and `uk`:
- `common.dialog.close`, `common.dialog.discardQuestion`, `common.dialog.discard`,
  `common.dialog.keepEditing`, `common.dialog.cancel`;
- `common.toast.close`;
- `divelog.dialog.editTitle` (with the site and date), `divelog.table.delete`,
  `divelog.table.deleteEntry`, `divelog.confirmDelete`;
- `achievement.seeAll`;
- `user.certificates.add`, `user.certificates.editTitle`, `user.certificates.confirmDelete`.

Keys that become unused (the inline confirmation strings) are removed from both locales.

No REST endpoints, Flyway migrations or new i18n namespaces.

### D9. Design files
- `design/system/components/Dialog/` and `Toast/`, each with a README and a `preview.html`, and
  their reference styles in `bundle.css`.
- `design/screens/DiveLog.html`: the table at full width, with Edit and Delete on each row and a
  second screen showing the open dialog.
- New `design/screens/Certificates.html` (list plus dialog).
- `docs/DESIGN.md` lists both components and the new screen.

## Risks / Trade-offs

- [The jsdom shim can hide a real `<dialog>` behaviour difference] → E2E asserts the native path:
  - the dialog is open and named;
  - Escape closes it and focus returns to the opener;
  - the axe scan runs with the dialog open.
- [A toast is announced but disappears before a slow screen-reader user reads it] → The timer
  pauses on focus and hover, and every achievement stays listed on the profile.
- [Nested dialogs: Escape in the discard question could close both] → `cancel` is handled per
  dialog with `stopPropagation`, and a unit test fires Escape on the inner one.
- [E2E selectors change] → `dive-achievement.spec.ts` changes from the form name to the dialog
  role. The a11y suite's `/dive-log/new` scan is removed, because the route does not exist (it
  rendered the not-found page).
