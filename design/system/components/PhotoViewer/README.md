# PhotoViewer

An overlay that shows a full-size photo over the page: review photos, post images and the certificate photo in the moderation queue.

- **Built on** `yet-another-react-lightbox`, wrapped by `components/PhotoViewer` in the front-end. The page behind it is inert while it is open.
- **Opening:** each thumbnail stays a link to the photo's file. A plain click opens the viewer at that photo; Ctrl, Cmd, Shift or a middle click is left to the browser, so "open in a new tab" still works. A post cover and an avatar do not open it.
- **Anatomy:** the photo, fitted to the viewport on a dark backdrop, a close button, and previous and next buttons when there is more than one photo of the same item (a review, a post). There are no previous or next buttons for a single photo, and it does not wrap from the last photo to the first.
- **Keys:** Escape closes it, the left and right arrow keys move between photos, and a swipe moves on a touch screen. A click on the backdrop closes it.
- **Focus:** focus moves into the viewer, and returns to the thumbnail that opened it on close.
- **Motion:** the library's short fade and slide, none under `prefers-reduced-motion`.
- **Labels:** the buttons are named in the active language ("Close photo", "Previous photo", "Next photo").
- **Consumer provides:** the photos of one item (full-size URL and text alternative) and the thumbnail links.
