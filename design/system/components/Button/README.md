# Button

Buttons trigger actions. Links that navigate look like links, not buttons, except the primary call to action of a page.

- **Variants:** `primary` (one per view: "Write a review", "Save", "Log in"); `secondary` (alternatives: "Cancel", "Add photo"); `ghost` (low-emphasis actions in toolbars and cards: "Edit"); `danger` (destructive: "Delete review"). Destructive actions always ask for confirmation in a dialog.
- **Sizes:** default 40px high; `sm` 32px for dense rows (review actions, moderation queue).
- **Content:** a verb first, sentence case, from the locale files ("Log a dive", not "LOG A DIVE"). An icon may lead the label; icon-only buttons need an `aria-label`.
- **States:** hover darkens to `accent-strong`; focus shows the 2px `focus` ring; disabled is 50% opacity and keeps its label; while saving, keep the width and show "Saving…".
- **Consumer provides:** the label text (translated), `onClick` or `type="submit"`, and `disabled` when the action is unavailable.
