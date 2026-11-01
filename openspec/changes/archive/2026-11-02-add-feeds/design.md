# Design: add-feeds

## Context

`add-posts` built `posts`, `PostSummaryResponse`, `PostCard`, `GET /api/v1/users/{id}/posts` and `GET /api/v1/posts/drafts`. A post linked to a site always stores the site's region, and `published_at` survives moving back to drafts. `SiteSearch` already composes a JPA `Specification` for the markers endpoint. `design/screens/Feed.html` is the page and `design/screens/Site.html` has the "Posts about this site" list.

## Goals / Non-Goals

Goals: US-13, US-15 and US-16, reusing the summary and card.

Non-goals: following, search, other sort orders.

## Decisions

### D1. One list endpoint with optional filters

`GET /api/v1/posts?countryCode=&regionCode=&siteId=&page=&size=` answers a page of `PostSummaryResponse`, public, under the existing public GET rule. There is no separate site or region endpoint: the three are the same query.

Sort is fixed at `published_at DESC, id DESC`, set in the service with `PageRequest.of(page, size, sort)`, so a client's `sort` parameter is ignored and an index always serves it.

Unknown codes give an empty page, not a 400. A feed filter is not a write, and a stale link should not look like an error. A `siteId` for an unapproved site also gives an empty page, because a post can only link to an approved site.

### D2. A Specification, with the entity graph of the blog

The filters compose as a `Specification<Post>`, as in `SiteSearch`, so Postgres never has to type a null parameter. `PostRepository` adds `JpaSpecificationExecutor<Post>` and overrides `findAll(Specification, Pageable)` with the same entity graph as the blog. Covers still come in one `MediaService.views` call, through the existing `summaries` method.

### D3. Indexes

`V15__index_post_feeds.sql` adds partial indexes on published posts: `(published_at DESC, id DESC)`, `(region_code, published_at DESC)` and `(site_id, published_at DESC)`. A country filter joins `regions` and uses the first.

### D4. Feed page state lives in the URL

`/feed?country=&region=&site=&page=`, read with `useSearchParams`, with `page` one-based and omitted on the first page. A filtered feed can be linked, reloaded and reached with the back button. Countries and regions come from the cached `GET /api/v1/countries`, and the region select lists all regions until a country is chosen, grouped by country as in the editor.

Choosing a region with no country keeps the country unset: the region alone is enough to filter.

`keepPreviousData` keeps the list in place while the next page loads. Choosing another page scrolls to the top, because Next sits below the list.

### D5. Naming the filtered site

`/feed?site=<id>` names the site through `GET /api/v1/sites/{id}`, which also works when the site has no posts. If that request fails, the page shows the filter's generic text with the same link to the whole feed. The country and region selects stay available and apply together with the site.

### D6. Sharing the card and drafts

- `PostCard` gains a `showAuthor` prop, on in the feed and off on a profile, where the author is the page's subject.
- `DraftList` moves out of `ProfilePosts`, and both pages use it. Its existing Vitest coverage stays.
- `SitePosts` asks for `siteId` and `size=3`, and uses `page.totalElements` to decide on See all posts. It is rendered in `SitePage`'s aside, below the facts card, only for an approved site, as `design/screens/Site.html` places it.
- The navigation order follows the design: Map, Feed, Dive log. The `/` route stays the map.
- i18n: `post.feed.*`, `post.site.*` and `shell.nav.feed` in `en` and `uk`. `post.editor.siteHint` changes its text.

## Risks / Trade-offs

- `size=3` with a count query on every site page is one extra query, which is acceptable.
- The feed's total count runs on each page. With a demo dataset this is not a concern.

## Migration Plan

Additive indexes; nothing existing changes.

## Open Questions

None.
