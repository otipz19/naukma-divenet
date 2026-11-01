# Tasks

## 0. Plan updates

- [x] 0.1 Apply the roadmap edit asked for by `docs/plan-updates/add-feeds/add-posts--reuse-post-card.md`, and delete the note; done with this proposal.

## 1. Back-end

- [x] 1.1 Add `V15__index_post_feeds.sql`, and the list query with its filters (design D1-D3), and `GET /api/v1/posts`. Add `PostFeedApiIT` covering every scenario of the API requirements of spec `post/feed`, including the query count; verify it, `DatabaseBaselineIT` and `LayeredArchitectureTest` pass.
- [x] 1.2 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Front-end

- [x] 2.1 Add `showAuthor` to `PostCard`, move `DraftList` out of `ProfilePosts`, and add `FeedPage`, its route and the navigation entry, with `en` and `uk` strings (design D4-D6). Add Vitest tests with MSW covering every page scenario of spec `post/feed`, asserting that a signed-out visitor makes no drafts request; verify they and the existing profile and shell tests pass.
- [x] 2.2 Add `SitePosts` to `SitePage`, with `en` and `uk` strings. Add Vitest tests covering the `site/details` delta, asserting that an unapproved site makes no request, and add default MSW handlers; verify they and the existing site tests pass.
- [x] 2.3 Change the editor's site hint in `en` and `uk`, and cover the `post/editor` delta in Vitest; verify the post tests pass.

## 3. Integration

- [x] 3.1 Update `docs/ARCHITECTURE.md` if a rule changes; verify it still matches the `post` module row and design D1.
- [x] 3.2 On the running stack, in a browser at 1280 px and 375 px, in `en` and `uk` and both themes, with real clicks: publish posts in two regions as a test user, read the feed signed out and signed in, filter by country and region, reload a filtered address, page through it if there is more than one page, and follow a site page's posts section to the filtered feed. Fix any gaps; verify with screenshots.
- [x] 3.3 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [x] 3.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/add-feeds/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-feeds` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
