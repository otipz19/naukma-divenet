# F-25 A photo opens the raw image file and leaves the app

- **Area:** Reviews, posts, moderation
- **Status:** done: polish-demo-walkthrough (owner decided 2026-11-22)
- **Delivered by:** `polish-demo-walkthrough` (see the index)

## Seen
Clicking a review photo replaces the page with the bare image file (`/media/<uuid>`) on
a black background. The only way back is the browser's Back button. Post photos and a
certificate photo in the moderation queue open the bare file in a new tab.

## Cause
Each photo is a plain link to its media URL: `features/review/ReviewCard.tsx` (same
tab), `features/post/PostPage.tsx` and `features/user/CertificateQueue.tsx` (new tab).
The app has no photo viewer.

## Fix (owner's decision)
A photo opens in an overlay viewer from a library (owner: "some lib that adds a simple
overlay photo viewer"), over the current page, with close, next and previous among the
photos of the same review or post. The proposed library is `yet-another-react-lightbox`.
It adds a front-end dependency (`frontend/package.json`, `pnpm-lock.yaml`), which the
owner approved by asking for a library.
