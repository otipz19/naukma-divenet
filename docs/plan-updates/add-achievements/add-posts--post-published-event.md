---
target: add-achievements
source: add-posts
kind: add-scope
stories: [US-10]
created: 2026-11-01
---
## What changes for the target
Publish `PostPublished` from `PostService` when a post is first published, that is, when `published_at` goes from null to a time.

## Why
An event with no consumer would be dead code, so `add-posts` leaves it to the change that first uses it.

## What the source already built
`PostService` in `ua.ukma.divenet.post.service`. A post can move back to drafts and be deleted, and it keeps `published_at` when
moved. Decide there whether "5 published posts" counts current published posts or first publications.

## Roadmap edit when absorbed
Delivers: add "publishes PostPublished".
