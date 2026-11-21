# F-16 No visible way to delete a dive

- **Area:** Dive log (`/dive-log`)
- **Status:** decided
- **Delivered by:** `add-dialogs-and-toasts`

## Seen
The owner found no delete button for a logged dive.

## Cause
Delete exists, but it is hidden. Spec `divelog/log-page` puts it *inside the form
while editing* ("While editing, the form SHALL offer Save, Cancel and Delete").
`DiveForm.tsx` shows it only after Edit, next to Save, and the table rows have
only Edit. Together with F-15, a user has no reason to look there.

## Fix
- Each table row gets a Delete action (an icon button with a translated accessible
  name, or a row menu with Edit and Delete).
- Delete asks for confirmation in a small dialog that names the entry, for example
  "Delete the dive at SS Thistlegorm on 12 Mar 2026?".
- The edit dialog may keep a Delete button as well.
- Spec change: the Delete scenarios move to the row. A dive that counted towards an
  achievement does not take it away; awards are permanent (`achievement` spec).
