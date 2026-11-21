# F-17 Certificate editing is unclear; move create and edit into a dialog

- **Area:** Certificates (`/profile/certificates`)
- **Status:** done: add-dialogs-and-toasts (owner's proposal: dialogs, same as F-15)
- **Delivered by:** `add-dialogs-and-toasts`

## Seen
Editing a certificate looks odd: as on the dive log page, it is not obvious that the
form holds the certificate being edited.

## Cause
`frontend/src/features/user/CertificatesPage.tsx` uses the dive log's pattern: a list
plus a form beside it that is always open and is reused for edit. There is even a
workaround comment: "On a phone the form is below the list, so Edit would otherwise
seem to do nothing." No mockup exists for this page (`design/screens/` has none), so
it was never designed.

## Fix
The same pattern as F-15:
- the list is the page, with "Add a certificate" above it;
- Add and each item's Edit open a dialog whose title names the certificate;
- Delete stays on the item, with a confirmation dialog;
- the agency, level, number and photo fields move into the dialog unchanged;
- a verified certificate that is edited goes back to unverified, as now, and the
  dialog says so before saving.

Spec change in `user/certificates` ("The certificates page manages the user's
certificates"). Add a mockup for the page in `design/screens/`.

## Check alongside
The gear locker (`user/gear-locker`) and the profile edit page may use the same
"form beside the list" pattern. The next tour steps should confirm this, so that the
change treats every such form the same way.
