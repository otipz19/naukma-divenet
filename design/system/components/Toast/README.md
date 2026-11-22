# Toast

A short message in a corner of the viewport after something happened: an achievement unlocked by a saved dive.

- **Region:** the app shell holds one toast region, a `role="status"` live region, so each toast is announced politely. Toasts stack in the bottom-right corner on a desktop, the newest last; below `bp-md` they span the bottom of the screen.
- **Anatomy:** a `success` icon (Lucide `circle-check`, decorative), an optional bold title, text, an optional link ("See achievements") and a close button with Lucide `x`.
- **Lifetime:** it closes on its own after about 10 seconds, or on its close button. The timer pauses while the pointer is over it or focus is inside it, and starts again when they leave.
- **Not in the top layer:** a toast sits under an open modal dialog, so show it after the dialog closes (the achievement toast follows the save that closes the dive dialog).
- **Not for errors** that need an action: a failed save stays an inline `Alert` in its form.
- **Consumer provides:** title, text and an optional link.
