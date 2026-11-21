# F-13 Validation messages break the dive form layout

- **Area:** Dive log (`/dive-log`)
- **Status:** done: PR #38
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

## Confirmed cause (fix/ui-defects)
Reproduced on the stack at 1280 px and 375 px wide, with "abc" in Max depth:
- the `.pair` row grew to 131 px to hold the error;
- the Visibility field next to it was stretched to the same height;
- its `.field` grid has the default `align-content: normal`, so its two auto rows shared the
  extra 65 px: label row 20 → 53 px, input 42 → 74 px (at 375 px: 20 → 52, 44 → 76).

The hypothesis holds. Fix: `align-content: start` on every grid field component
(`TextField`, which `SelectField` shares, plus `PasswordField`, `PhotoField`, `VideoField`)
and on `dn-field` in `design/system/components/bundle.css`.

After the fix, the same inputs keep Visibility at 20 + 42 px, with its input level with
Max depth's. The Current select next to an invalid Water temp behaves the same, at both
widths. Also checked with errors showing:
- submit site: a valid latitude next to an invalid longitude keeps 20 + 42 px;
- certificates, review and warning: single-column forms, so they were never affected.

## Hypothesis (confirmed)
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
