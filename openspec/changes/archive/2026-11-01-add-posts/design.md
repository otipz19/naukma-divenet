# Design: add-posts

## Context

The `post` feature does not exist yet. `ReviewService` already shows how a feature attaches and releases media. `SiteCatalogService.findApproved` and the dive log's `SitePicker` already handle choosing an approved site. `GET /api/v1/countries` returns countries with their regions. `design/screens/PostEditor.html` is the editor, and the cards in `design/screens/Feed.html` are the model for the blog.

## Goals / Non-Goals

Goals: US-12 complete, with a card and API that `add-feeds` can reuse.

Non-goals: feeds, `PostPublished`, rich text, autosave (see the proposal).

## Decisions

### D1. Data

`V14__create_posts.sql`:

- `posts`: `id`, `author_id` (cascade with the user), `title varchar(200)`, `text varchar(20000)` not null and empty for a textless draft, `status` (`DRAFT`, `PUBLISHED`), `cover_id` (media, set null), `region_code` (regions, nullable), `site_id` (sites, set null), `published_at`, `created_at`, `updated_at`.
- `CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL)`.
- `post_media`: `post_id` (cascade), `media_id`, `position`, primary key `(post_id, media_id)`, as `review_media`.
- Index `(author_id, published_at DESC)` for published posts and `(author_id, updated_at DESC)` for drafts. `add-feeds` adds the indexes its filters need.

`published_at` survives moving back to drafts, so publishing again neither bumps a post up a feed nor counts as a new publication.

### D2. Plain text, with images after it

The design's hint says "Paragraphs and images". Placing images inside the text would need a markup language and a sanitizer. Text is plain, split into paragraphs on blank lines, and rendered by React as text, so it cannot inject markup. The images follow the text. Alternative rejected: Markdown, which adds a dependency and an XSS surface for no story.

The cover stays a separate field, as the design draws it. `coverId` and `photoIds` are attached and released as one set, following `ReviewService.update`.

### D3. Status is part of the save

`POST` and `PUT` take `status`, so publishing with edits is one transaction, and the editor's two buttons send the same form. There is no separate publish endpoint. The API requires text only for `PUBLISHED`.

### D4. Region and site

A site with no region takes the site's region. This means `add-feeds` can filter on `region_code` alone. A mismatch is a 400 on `siteId`. The site must be approved, through `SiteCatalogService.findApproved`. Responses give `regionCode` and `countryCode`, and the front-end translates them from the locale files, as the dive log does.

### D5. Endpoints

| Method and path | Access | Answer |
| --- | --- | --- |
| `POST /api/v1/posts` | signed in | 201 `PostResponse` |
| `GET /api/v1/posts/{id}` | anyone; a draft only to its author, otherwise 404 | `PostResponse` |
| `PUT /api/v1/posts/{id}` | author | `PostResponse` |
| `DELETE /api/v1/posts/{id}` | author | 204 |
| `GET /api/v1/users/{id}/posts` | anyone | page of `PostSummaryResponse` |
| `GET /api/v1/posts/drafts` | signed in | page of `PostSummaryResponse` |

`GET /api/v1/posts/drafts` joins the list of authenticated GET rules in `SecurityConfig`, ahead of the public `GET /api/v1/**` rule. Spring prefers the literal path over `{id}`.

`PostSummaryResponse` has `id`, `title`, `excerpt`, `readMinutes`, `status`, `publishedAt`, `updatedAt`, `author`, `cover`, `countryCode`, `regionCode` and `site`. The excerpt is the first 200 characters of the text, cut at a word and normalised to one line. `readMinutes` is words divided by 200, rounded up, at least 1. Both are computed in the service. Lists use one fetch-joined query plus one `MediaService.views` call for the covers.

Admins get no special access: a draft is private, and no story asks for admin removal.

### D6. Front-end

`features/post/`: `api.ts`, `PostEditorPage`, `PostPage`, `PostCard`, `ProfilePosts`, `routes.tsx`, and `Post.module.css`.

- The editor uses React Hook Form with Zod. The status comes from the clicked button, and the Zod schema depends on it (text required for Publish). `PhotoField` with `max={1}` for the cover and `max={10}` for images. `SelectField` with region options grouped by country, `SitePicker` from `features/divelog`.
- `SitePicker` returns `{id, name}` with no region. The site's region comes from a `GET /api/v1/sites/{id}` call when a site is picked, which is one request and leaves the picker unchanged.
- `SitePicker` gained an optional `hint`, because its default hint speaks of the dive log.
- The region select is set again once its options load, because a select cannot show a value before its option exists.
- A new draft replaces the URL with its editor, and the editor shows a saved message.
- `ProfilePosts` is rendered in `ProfilePage` beside `ProfileDives`, and requests drafts only for the owner. It pages with Previous and Next, as `design/screens/Feed.html` draws.
- `PostCard` takes a summary, so `add-feeds` can reuse it.
- i18n namespace: `post.*` in `en` and `uk`. The Feed's navigation entry belongs to `add-feeds`, so until then the entry point is the profile.

## Risks / Trade-offs

- A post page cannot be reached from a feed until `add-feeds` lands. The profile is enough for a working US-12.
- Images are public to anyone with their URL, even on a draft, as with all media (ADR-0006).
- An excerpt cut at 200 characters is not language-aware, which is enough for `en` and `uk`.

## Migration Plan

Additive migration; nothing existing changes.

## Open Questions

None.
