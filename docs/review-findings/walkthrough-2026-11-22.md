# Demo-readiness walkthrough (2026-11-22)

A walkthrough of the stack built from `master` at `8522590` (after PR #44), run with
`docker compose up --build` on http://localhost:8080. Nothing was fixed. The findings are
sorted by how much they would hurt the demo.

Covered: the visitor (map, search, filters, site page, feed, sign-up validation), the
diver (sign-up, dive log create, edit and delete, achievement toasts, post with a
site link, review, warning, site submission, certificate, gear locker, profile edit,
another diver's profile), the admin (moderation of sites and certificates, rejecting
with and without a reason, verifying, hiding a warning), Ukrainian, dark theme, and
the phone layout (375 px: map, site page, feed; no horizontal overflow). The console
showed no unexpected errors. The 401, 404 and 409 responses all came from deliberate
test steps.

## Owner's decisions (2026-11-22)

| Item | Decision |
| --- | --- |
| W-04 photos leave the app | taken as [F-25](F-25-photos-leave-the-app.md): overlay photo viewer library |
| W-05 difficulty labels | taken as [F-26](F-26-difficulty-two-intermediates.md): option A, the four words in the submit form |
| W-08 placeholder media | taken as [F-28](F-28-seed-photos-are-drawn.md): real seed photos, no site photos |
| W-10 map zoom | taken as [F-27](F-27-map-does-not-zoom-to-results.md) |
| W-12 feedback | moderation feedback taken as [F-29](F-29-moderation-gives-no-feedback.md) (toasts); confirmation styles declined |
| W-13 privacy hint | taken as [F-30](F-30-stale-privacy-hint.md) |
| W-14 login reason | taken as [F-31](F-31-guest-action-without-reason.md): a "log in to do this" dialog |
| W-01 to W-03, W-06, W-07, W-09, W-11, W-15 to W-17 | declined: not important for the demo |

## Critical: fix before the demo

### W-01 Leftover manual-test data in the database

The database volume holds content that is not from the seed:

- User `john@mail.com` (id 10). Its display name is its email address.
- Post 48, titled "test" with the body "test", is published. Its cover is a photo of a
  person holding a Ukrainian ID card. As the newest post it is the **first card in the
  feed**, and it also shows on the Cod Hole site page.
- A pending certificate, "PADI dawaw / dwad", has a photo of a real public figure. It is
  in the admin's moderation queue.

This walkthrough also added test data: the user "Review Tester"
(`reviewtester@example.test`) with a dive, a post, a review, a gear item and a verified
certificate, a rejected site ("Review Test Reef") and a hidden warning on Blue Hole.

**Fix:** start the demo from a fresh database volume (`docker compose down -v`, then
`up --build`) so that only the seed remains. This deletes data, so the owner runs it or
approves it.

## High: makes the demo look unfinished

### W-02 All seed content is dated the day the seed ran

Every post, review and achievement shows "22 November 2026". Every warning shows
"today", and every post shows "1 min read". The feed and site pages look like they were
generated a minute ago, not like an active community. Spreading the seed's
`created_at` / `published_at` / `achieved_at` over past weeks and months would fix it.

### W-03 Ratings are thin, and the default list shows it

23 of the 52 approved sites have no rating, and 25 have exactly one. The map list is
sorted by rating by default, so it opens with a column of "★★★★★ 5.0 (1)" cards.
More seed reviews, with varied scores, would make the ratings and the "Highest rated"
sort meaningful.

## Medium: noticeable when someone clicks around

### W-04 A photo opens the raw media file and leaves the app

Clicking a review photo (and a post image, which is also a plain link to
`/media/<uuid>`) navigates the same tab to the bare image file on a black page. There
is no lightbox and no app chrome. The only way back is the browser's Back button.

### W-05 Difficulty has 5 levels but 4 labels

The submit-site form offers "1 · Beginner, 2 · Intermediate, **3 · Intermediate**,
4 · Advanced, 5 · Technical". Level 3 sites show an INTERMEDIATE badge, so two
different levels look the same. The map filter has 4 chips. It is hard to explain
during a site-submission demo.

### W-06 Achievements from posts and sites unlock silently

Logging a dive shows "Achievement unlocked" toasts. Publishing a first post earned
"First post" (visible on the profile) with no toast, and the same goes for Storyteller
and Site scout. The spec only asks for toasts on the dive log page, so this follows the
spec. It is still inconsistent, and the "first post" moment is lost in a demo.

### W-07 The display name cannot be changed after sign-up

Edit profile offers a photo, a bio and the privacy switches, but no display name.
Someone who types their email into "Display name" (as `john@mail.com` did) shows it
publicly on every post and review, with no way to change it.

### W-08 Seed media are placeholders, and sites have no photos

Review and post images are the same flat, generated underwater illustration. Site
pages have no photo at all. This is fine for function, but weak visually in a
showcase.

## Low: polish

- **W-09 The disclaimer shows on every full page load** (deep links, refreshes, the 404
  page) until "Don't show again" is ticked. This is per the spec. Tick it in the demo
  browser beforehand.
- **W-10 The map does not zoom to the filtered results.** With "Technical" selected,
  the world view stays put with a single "2" cluster near Mexico.
- **W-11 Submit site does not check the location.** A point in inland Pakistan was
  accepted as Egypt / Dahab, because country and region are not taken from the map
  point or checked against it. The success message is an inline alert at the bottom of
  a form that has just been cleared, not a toast. Only the 22 seeded countries can be
  chosen.
- **W-12 Confirmation patterns differ.** Deleting a dive uses the ConfirmDialog.
  Hiding or deleting a warning uses an inline "Yes, hide" row. Approve, reject and
  verify in moderation give no feedback: the card just disappears.
- **W-13 Stale privacy hint.** Edit profile says "These apply as dive logs and
  certificates are added to profiles.", which is wording from before those features
  existed.
- **W-14 A redirect to login gives no reason.** When "Write a review" sends a visitor
  to Log in, the page does not say why.
- **W-15 The "Your certificates" page has no link back to the profile.**
- **W-16 "Deep diver" stays earned after the only deep dive is edited to 32 m.** The
  profile then shows "Deepest 32 m" next to a "≥ 40 m" badge. This is an edge case and
  probably intended (achievements are permanent).
- **W-17 The dive log has no duration (bottom time) field.** Divers would expect one.
  This is a product gap, not a bug.

## Checked and fine

Search and filters with the URL kept in sync, site page sections and "Posts about this
site", sign-up validation and the duplicate-email message, the dive dialog with site
search, edit and delete confirmation, the 10 s achievement toasts, post publishing with
the region filled in from the site, the review flow and its updated average, warning
create and hide, the site submission and rejection round trip, certificate
verification showing as a badge on reviews, the gear locker, the privacy switches, the
admin header with the pending count and no diver actions, feed paging (3 pages), the
feed country filter narrowing the region list, Ukrainian translations of all the UI
text (user content stays in its own language), dark theme, and the phone map and pages.
