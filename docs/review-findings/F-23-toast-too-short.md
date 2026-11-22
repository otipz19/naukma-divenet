# F-23 Achievement toasts disappear too fast

- **Area:** Achievements, app shell
- **Status:** taken: polish-second-review
- **Delivered by:** `polish-second-review` (see the index)

## Seen
After saving a dive, the "Achievement unlocked" toast is gone before it can be read,
especially when several show at once.

## Cause
As specified: every toast closes after `TOAST_MS = 6000` (`components/Toast/Toast.tsx`,
spec `shared/app-shell` "The app shell shows toasts"). An achievement toast carries a
title, a description and a link, which takes longer to read than a one-line
confirmation.

## Fix (owner, 2026-11-22)
Every toast stays 10 s instead of 6 s (`TOAST_MS`). Hover and focus still stop the
timer, and the close button stays. Spec change in `shared/app-shell`.
