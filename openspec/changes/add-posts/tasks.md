# Tasks

## 1. Back-end

- [ ] 1.1 Add `V14__create_posts.sql` and the `post.domain` entity and repository (design D1); verify with `DatabaseBaselineIT` and the `ddl-auto=validate` startup.
- [ ] 1.2 Add `PostService` writes with validation, media and region and site links (design D2-D4), and the controller's write endpoints. Add `PostApiIT` covering the scenarios of "A signed-in user writes a post", "A post is validated", "A post links to a region and a site" and "Authors edit and delete their posts"; verify it and `LayeredArchitectureTest` pass.
- [ ] 1.3 Add the reads, the blog and drafts lists, excerpts and reading times (design D5), and the security rule. Add integration tests in `PostReadApiIT` for "Published posts are public and drafts are private" and "A blog and the user's drafts are listed", including the query count, and a unit test for the excerpt and reading time; verify they pass.
- [ ] 1.4 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Front-end

- [ ] 2.1 Add `features/post/api.ts`, `PostPage` and its route, with `en` and `uk` strings. Add Vitest tests with MSW covering every scenario of spec `post/pages`; verify they pass.
- [ ] 2.2 Add `PostEditorPage` and its routes, with `en` and `uk` strings. Add Vitest tests with MSW covering every scenario of spec `post/editor`; verify they pass.
- [ ] 2.3 Add `PostCard` and `ProfilePosts` to `ProfilePage`, with `en` and `uk` strings. Add Vitest tests covering the `user/profile` delta, asserting that other visitors make no drafts request, and add default MSW handlers; verify they and the existing profile tests pass.

## 3. Integration

- [ ] 3.1 Update `docs/ARCHITECTURE.md` (existing tables, the cover relation in the ER diagram, the draft privacy rule); verify against design D1 and D5.
- [ ] 3.2 On the running stack, in a browser at 1280 px and 375 px, in `en` and `uk` and both themes, with real clicks where the page allows: write a draft with a cover and images, publish it with a region and site, read it as an anonymous visitor, move it back to drafts, and delete it. Fix any gaps; verify with screenshots.
- [ ] 3.3 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [ ] 3.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/add-posts/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-posts` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
