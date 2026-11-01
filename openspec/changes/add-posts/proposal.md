# Proposal: add-posts

## Why

Divers can log and review dives, but cannot yet tell the story of one. US-12 asks for blog posts with text and images, kept as drafts or published, and linked to a region and/or a site. Feeds (`add-feeds`) and the "5 published posts" achievement (`add-achievements`) both need posts to exist first.

## What Changes

- New `post` feature: tables `posts` and `post_media`, and an API to create, edit, delete and read posts.
- A post has a title, plain text in paragraphs, an optional cover photo and up to 10 images. It may link to a region, an approved site, or both.
- A post is a draft or published. Drafts are visible only to their author. A published post can move back to drafts.
- Post editor at `/posts/new` and `/posts/:id/edit`, following `design/screens/PostEditor.html`.
- Post page at `/posts/:id`.
- The author's blog is a section of the profile page, with the owner's drafts and a "Write a post" link.

## Capabilities

### New Capabilities

- `post/posts`: writing, validating, reading and listing posts through the API.
- `post/editor`: the editor page.
- `post/pages`: the post page.

### Modified Capabilities

- `user/profile`: the profile page shows the author's published posts, and the owner's drafts.

## Impact

- Stories: US-12.
- Back-end: new package `ua.ukma.divenet.post`, migration `V14__create_posts.sql`, a security rule for the drafts endpoint, regenerated `api/openapi.json`.
- Front-end: new `features/post`, a section in `ProfilePage`, reuse of `PhotoField` and the dive log's `SitePicker`, `en` and `uk` strings.
- `docs/ARCHITECTURE.md`: existing tables, the `posts` to `media` cover relation in the ER diagram, and the draft privacy rule. No departure from its rules, so no ADR.

## Out of scope

- The global, region and site feeds, the Feed page and its navigation entry, and the site page's post section: `add-feeds`.
- Publishing `PostPublished`: `add-achievements`, the first consumer, as with `DiveLogged`.
- Rich text, Markdown and images placed inside the text. Text is plain paragraphs, and images follow it (design D2).
- Autosave, including the design's "Saved 2 minutes ago" line.
- Admin removal of posts, comments and likes. No story asks for them.
- Demo posts: `complete-demo-seed`.

## Plan updates absorbed

None.

## Plan updates written

- `docs/plan-updates/add-feeds/add-posts--reuse-post-card.md`
- `docs/plan-updates/add-achievements/add-posts--post-published-event.md`
