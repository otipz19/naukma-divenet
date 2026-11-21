# Dialog

A modal window over the page for a short task: logging or editing a dive, adding or editing a certificate, a confirmation before a destructive action, the first-visit safety notice.

- **Built on** the native `<dialog>` opened with `showModal()`: the browser puts it in the top layer and makes the page behind it inert. The backdrop is the `scrim` token.
- **Anatomy:** a title row (an `h2` that names the dialog, and a close button with Lucide `x`), a body that scrolls, and an actions row at the end (secondary actions first, the primary action last).
- **Closing:** Escape, the close button and Cancel close it, and focus returns to the control that opened it. A click on the backdrop does nothing, so a half-filled form is never lost.
- **Unsaved changes:** a dialog holding a form asks "Discard changes?" (Discard, Keep editing) before it closes with changed fields. Saving closes it without asking.
- **Width:** `reading-max` at most on a desktop. Below `bp-md` it fills the screen with no radius; the title row and the actions row stay in place while the body scrolls.
- **Confirmation dialog:** a small dialog whose title is the question and names the item ("Delete the dive at SS Thistlegorm on 12 May 2026?"), with Cancel and a `danger` button. Focus starts on Cancel, so Enter never deletes by accident.
- **Motion:** a 150 ms fade in, none under `prefers-reduced-motion`.
- **Consumer provides:** the title, the body, the actions, and whether the form has unsaved changes.
