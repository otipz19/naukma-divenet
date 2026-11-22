# Proposal

## Why

A full walkthrough of the app before the demo
(`docs/review-findings/walkthrough-2026-11-22.md`) found rough edges a viewer would notice.
The owner kept seven of them as findings F-25 to F-31 and declined the rest. Each one is
small, and together they decide how polished the demo looks.

## What Changes

- **Photo viewer (F-25).** Clicking a review photo, a post image or a certificate photo in
  the moderation queue opens it in an overlay viewer over the current page. The viewer has
  close, previous and next among the photos of the same review, post or certificate.
  Today a review photo replaces the page with the raw image file, and the others open it
  in a new tab. The viewer comes from a library (owner's choice), `yet-another-react-lightbox`.
- **Difficulty as words in the submit form (F-26, option A).** The "Submit a dive site"
  Difficulty field offers the four words used everywhere else (Beginner, Intermediate,
  Advanced, Technical) instead of "1 · Beginner … 3 · Intermediate …". A word sends the
  lowest level it stands for, as the review form already does. Stored levels, the API
  and the badges stay as they are.
- **The map fits the results (F-27).** After a search or filter change, and when the
  page opens with a search or filters in the URL, the map moves to show all matching
  sites, with a zoom limit for a single site. With no search and no filters it keeps
  the world view.
- **Real photos in the demo seed (F-28).** Post covers, post images and review photos
  are real, freely licensed underwater photos kept in the repository with a credits file,
  in place of the drawn pictures. Avatars keep the drawn pictures. Sites get no photos
  (owner). The owner approves the photo list and its source before anything is downloaded.
- **Moderation feedback (F-29).** Approve, Reject and Verify each show a toast that names
  the result, for example "Nereo Cave approved".
- **Privacy hint (F-30).** The outdated hint on Edit profile ("These apply as dive logs and
  certificates are added to profiles.") is replaced in `en` and `uk` with one that says what
  the switches do. This is a copy change with no spec change.
- **Log-in dialog for visitor actions (F-31).** For a signed-out visitor, "Log a dive here",
  "Write a review", "Report a warning" and "Add a site" open a dialog instead of jumping to
  the log-in page. The dialog says the action needs an account and offers Log in and
  Cancel. Log in opens the log-in page, which returns to the action afterwards. The
  actions stay visible to visitors (F-09), and opening a protected URL directly keeps
  the current redirect.

Stories: US-01 (map), US-03 (reviews with photos), US-05 (search and filters), US-07
(site submission), US-08 (moderation), US-C1 (certificate verification), US-12 (posts).

Out of scope: everything the owner declined in the walkthrough. That includes resetting
the demo database, back-dating seed content, more seed reviews, achievement toasts outside
the dive log, editing the display name, and unifying the confirmation styles. Also out:
photos on site pages, zoom or download inside the viewer, and any API change.

## Capabilities

### New Capabilities
- `media/photo-viewer`: the overlay viewer that photos open in, and which photos open it.

### Modified Capabilities
- `review/site-reviews`: a review thumbnail opens the photo viewer.
- `site/submission`: the Difficulty field offers the four words.
- `site/search`: the map fits the matching sites.
- `site/moderation`: approving and rejecting a site shows a toast.
- `user/certificate-verification`: verifying and rejecting a certificate shows a toast.
- `auth`: diver actions ask a signed-out visitor to log in, in a dialog.
- `demo/seed`: post and review pictures are real photos from a credited set in the repository.

## Impact

- Front-end: a new dependency `yet-another-react-lightbox` (`frontend/package.json`,
  `pnpm-lock.yaml`; the owner asked for a library). A new `components/PhotoViewer` and a
  log-in prompt hook and dialog under `features/auth`. Changes in
  `features/review/ReviewCard.tsx`, `features/post/PostPage.tsx`,
  `features/user/CertificateQueue.tsx`, `features/site/SubmitSitePage.tsx`,
  `features/site/SiteClusterLayer.tsx` / `MapPage.tsx`, `features/site/ModerationPage.tsx`,
  `features/site/SitePage.tsx`, `features/warning/SiteWarnings.tsx`, and the `en` / `uk`
  locales, plus their Vitest tests and E2E checks.
- Back-end: `demo/service/DemoSeeder.java` reads photos from
  `src/main/resources/seed/photos/` with a `credits.json`. `DemoImages` stays for avatars.
  About 20 JPEG files of about 2–4 MB in total go into the repository.
- Design: `docs/DESIGN.md` and `design/system/components/` gain the photo viewer and the
  log-in prompt.
- Docs: `docs/review-findings` statuses for F-25 to F-31.
- No REST endpoint, migration or ADR change. The app's Content Security Policy already
  allows the viewer's inline styles (`style-src 'self' 'unsafe-inline'`) and same-origin
  images.

## Plan updates absorbed

None (`docs/plan-updates/polish-demo-walkthrough/` does not exist).
