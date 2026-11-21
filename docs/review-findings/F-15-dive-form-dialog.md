# F-15 Dive edit is not obvious; move create and edit into a dialog

- **Area:** Dive log (`/dive-log`)
- **Status:** decided (owner's proposal: dialogs)
- **Delivered by:** `add-dialogs-and-toasts`

## Seen
Pressing Edit on a row refills the form beside the table, but nothing makes it
clear that the form now holds that entry.

## Cause
The page follows `design/screens/DiveLog.html`: a table on the left and a form that
is always open on the right. The form serves both "Log a dive" and "Edit". Edit only
swaps the values and the buttons, and on a phone the form sits below the table, out
of sight.

## Fix
- The table is the page. "Log a dive" (in the page header and the site page) and each
  row's Edit open a dialog.
- The dialog's title says which one it is: "Log a dive" or "Edit dive: <site>,
  <date>". The dialog is full-screen on a phone.
- Save closes the dialog and refreshes the table; Cancel or Escape closes it without
  saving. If the form has unsaved changes, closing asks first.
- `/dive-log?site=<id>` (from the site page) opens the dialog with the site filled in.
- A native `<dialog>` with `showModal()` traps focus, and focus returns to the button
  that opened it. Axe audits must pass.
- Spec changes in `divelog/log-page`: "the form" becomes "the dialog"; the header
  and site entry points open it. Update `design/screens/DiveLog.html`.
- Delete moves to the row as well (F-16).
