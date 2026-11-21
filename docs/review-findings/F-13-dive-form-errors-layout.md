# F-13 Validation messages break the dive form layout

- **Area:** Dive log (`/dive-log`)
- **Status:** decided (fix the layout)
- **Delivered by:** `fix/ui-defects`

## Seen
Entering invalid values (for example a non-numeric depth) shows the validation
messages, but the form layout breaks.

## Required approach (owner, 2026-11-21)
Do not apply the hypothesis below blindly. The agent fixing this must:
1. **Reproduce** the shift on the running stack: enter invalid values in the dive
   form at desktop and phone widths, and screenshot the broken layout.
2. **Find the reason**: inspect the computed layout (grid tracks, element heights)
   before and after the errors appear, and name the exact rule that causes the shift.
3. **Fix** that cause, then show it on screen with a screenshot of the same
   inputs, and check the other forms that share the cause.

If the cause turns out to be different from the hypothesis, record the real one here.

## Hypothesis (not confirmed)
From reading the code only. In `frontend/src/features/divelog/DiveForm.tsx`,
max depth, visibility, water temperature and current sit in a two-column grid
(`.pair` in `DiveLog.module.css`). An error message makes one cell taller. The cell
next to it is stretched to the same height, and because `TextField`/`SelectField` are
grids themselves (`.field { display: grid }` in
`components/TextField/TextField.module.css`), the extra height is shared across the
label and input rows. The neighbour's label and input then move or grow.

## Fix, if the hypothesis holds
Pin the field content to the top: `align-content: start` on the field component
(fixes every form in the app), or `align-items: start` on `.pair`. Then check every
form with paired fields (dive log, submit site, certificates, review, warning) with
errors showing, at desktop and phone widths.
