# F-13 Validation messages break the dive form layout

- **Area:** Dive log (`/dive-log`)
- **Status:** decided (fix the layout)
- **Delivered by:** `fix/ui-defects`

## Seen
Entering invalid values (for example a non-numeric depth) shows the validation
messages, but the form layout breaks.

## Likely cause
To be confirmed on screen when fixing. In `frontend/src/features/divelog/DiveForm.tsx`,
max depth, visibility, water temperature and current sit in a two-column grid
(`.pair` in `DiveLog.module.css`). An error message makes one cell taller. The cell
next to it is stretched to the same height, and because `TextField`/`SelectField` are
grids themselves (`.field { display: grid }` in
`components/TextField/TextField.module.css`), the extra height is shared across the
label and input rows. The neighbour's label and input then move or grow.

## Fix
Pin the field content to the top: `align-content: start` on the field component
(fixes every form in the app), or `align-items: start` on `.pair`. Then check every
form with paired fields (dive log, submit site, certificates, review, warning) with
errors showing, at desktop and phone widths.
