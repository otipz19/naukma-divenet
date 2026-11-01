---
target: add-feeds
source: add-posts
kind: add-scope
stories: [US-13, US-15, US-16]
created: 2026-11-01
---
## What changes for the target
Add the Feed navigation entry, and the Feed page's "Write a post" link and "Your drafts" aside from `design/screens/Feed.html`.
In the post editor, add the site field's hint "The post appears on the site page", once that is true.

## Why
`add-posts` has no feed to put them on, so its only entry point is the profile, and the hint would not yet be true.

## What the source already built
`PostCard` and `PostSummaryResponse` in `frontend/src/features/post/` and the `post` package; `GET /api/v1/posts/drafts`. A post
linked to a site always stores the site's region, so the feed can filter on `region_code` alone. `published_at` survives moving
back to drafts, so sorting by it is stable. Add the indexes the filters need.

## Roadmap edit when absorbed
Delivers: add "Feed navigation entry, Write a post link and drafts aside".
