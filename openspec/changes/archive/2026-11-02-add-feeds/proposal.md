# Proposal: add-feeds

## Why

Posts can be written, but a reader can only find them through an author's profile. US-13, US-15 and US-16 ask for a feed of recent posts from everyone, filtered by country or region, and for a site's posts on its page. This completes M4.

## What Changes

- `GET /api/v1/posts`: published posts from everyone, newest first, paged, filtered by country, region or site.
- A Feed page at `/feed`, following `design/screens/Feed.html`, with country and region filters kept in the URL, post cards, and pagination. A signed-in user also gets a "Write a post" link and their drafts.
- A Feed entry in the main navigation.
- A "Posts about this site" section on the site page, with a "See all posts" link to the feed filtered by that site.
- The post editor's site hint says the post appears on the site page, which becomes true here.

## Capabilities

### New Capabilities

- `post/feed`: the feed API and the Feed page.

### Modified Capabilities

- `site/details`: the site page shows the posts linked to the site.
- `post/editor`: the site field explains where a linked post appears.

## Impact

- Stories: US-13, US-15, US-16.
- Back-end: a list endpoint in `PostController`, a `PostService` method, migration `V15__index_post_feeds.sql`, regenerated `api/openapi.json`.
- Front-end: `FeedPage` and `SitePosts` in `features/post`, a `SitePage` aside section, a navigation entry, `en` and `uk` strings. `PostCard` gains an optional author, and the drafts list moves out of `ProfilePosts` to be shared.
- No departure from `docs/ARCHITECTURE.md`, so no ADR.

## Out of scope

- Following authors, personal feeds, full-text search of posts, and sorting other than newest first. No story asks for them.
- A filter by site in the Feed page's controls. The site filter is reached from the site page, and can only be cleared there on the feed.
- Demo posts: `complete-demo-seed`.

## Plan updates absorbed

- `docs/plan-updates/add-feeds/add-posts--reuse-post-card.md`

## Plan updates written

None.
