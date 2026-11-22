# F-24 The dive log table header has no background over the actions column

- **Area:** Dive log
- **Status:** taken: polish-second-review
- **Delivered by:** `polish-second-review` (see the index)

## Seen
The header row's grey background stops after "Visibility"; above Edit and Delete it is
white.

## Cause
`DiveTable.tsx` gives the actions header cell the visually-hidden class
(`styles.hidden`: `position: absolute`, 1 px). That takes the whole `<th>` out of the
row, so no header cell spans the actions column and its background is missing.

## Fix
Keep the `<th>` in the row (with the header background) and hide only its text inside
it, so screen readers still read "Actions". No behaviour change; the DiveLogPage tests
that find the column header stay.
