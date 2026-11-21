# F-14 Achievement unlock shows inside the form; use a toast

- **Area:** Dive log, achievements
- **Status:** decided (owner's proposal: toasts)
- **Delivered by:** `add-dialogs-and-toasts` (see the index)

## Seen
After saving a dive, "Achievement unlocked" appears inside the dive form.

## Cause
This was specified. Spec `divelog/log-page` ("The dive log page announces an unlocked
achievement") asks for a live success alert, shown until the next save or edit.
`DiveLogPage.tsx` passes it into the form as `banner`.

## Fix
A toast: a short-lived notification in a corner of the screen, with a
`role="status"` live region so screen readers announce it. It shows the
achievement's name and description and a "See achievements" link to the profile. It
closes on its own after about 6 s, and has a close button. It also stops the timer
while hovered or focused, so keyboard and screen-reader users can read it
(WCAG 2.2.1).

- The design system has no toast component yet. Add one to `design/system/components/`
  and `docs/DESIGN.md`.
- One shared toast area in the app shell, so other features can use it as well (for
  example "Review published", "Post saved").
- Spec change in `divelog/log-page`: replace the alert requirement with a toast; the
  scenarios (one, two, none) stay.
- Achievements also come from publishing a post and from an approved site. Showing a
  toast there too is out of scope unless the owner wants it.
