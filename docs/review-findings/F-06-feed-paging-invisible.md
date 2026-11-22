# F-06 Feed paging exists but the demo never shows it

- **Area:** Feed (`/feed`)
- **Status:** done: polish-release (owner, 2026-11-21: option 2, more seeded posts)
- **Delivered by:** `polish-release`

## Seen
The feed shows no paging controls.

## Cause
It works as specified, but the demo cannot show it. Spec `post/feed` says Previous
and Next appear *when there is more than one page*. The API pages by 20
(`GET /api/v1/posts` answered `size: 20, totalElements: 10, totalPages: 1`), and the
demo seed has 12 posts, 10 of them published. So the feed always has one page.

## Impact
A demo cannot show US-13 ("reverse-chronological and paginated").

## Decision
Add published posts to `backend/src/main/resources/seed/demo.json`, spread across
the eight divers, several regions and sites, with covers, so that the feed has at
least three pages at the current page size of 20 (about 45 or more published posts
in all). Region and site feeds then have enough posts to show filtering too.
Update the `demo/seed` spec if it states counts, and keep
`complete-demo-seed`'s rules: seed through the services, generated images, and
text in the divers' own languages.

Owner, 2026-11-22: the new posts may reuse the pictures the seed already has.

Rejected: a smaller page size. It would show paging, but with a thin feed.
