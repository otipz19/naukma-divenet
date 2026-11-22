# Chip

A pill-shaped toggle for filter values that combine: difficulty levels, required gear, warning types.

- **Behaviour:** a `<button aria-pressed>`; pressed chips use `accent-soft` with an `accent` border and `accent-strong` text, and also show a check icon so the state is not colour alone.
- **Group:** wrap a set in `.dn-chips` inside a `fieldset` with a `legend` ("Difficulty"). Selecting several chips in one group means "any of"; different groups combine with "and".
- **Removable chip** (`.dn-chip--remove`): one active filter shown under the map search box, its label then a Lucide `x`. It is a plain `<button>` named "Remove filter: Beginner", not a toggle, so it has no `aria-pressed`; pressing it clears that filter.
- **Single choice** (minimum rating, sort order) uses a `select.dn-input`, not chips.
- **Consumer provides:** the translated label, pressed state and toggle handler.
