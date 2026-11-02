# Tasks

## 1. Back-end

- [x] 1.1 Add `V18__add_videos.sql` and nullable dimensions on `Media`; verify with `DatabaseBaselineIT` and the `ddl-auto=validate` startup.
- [x] 1.2 Add `VideoSniffer` with unit tests for each signature in design D1, the upload endpoint, the limits (design D2, D4), and `VideoApiIT` covering "Signed-in users upload videos", "The image limit stays at 10 MB", "Videos are served with range requests" and "Videos follow the upload lifecycle"; verify they and the existing media tests pass.
- [x] 1.3 Split `attach` by kind (design D3). Add tests in `VideoApiIT` for "Images and videos are attached only as themselves", across review photos, post covers and images, avatars and certificate photos; verify they pass.
- [x] 1.4 Add videos to reviews (design D6). Add `ReviewVideoApiIT` covering every scenario of the `review/reviews` delta, including the query count; verify it and `ReviewApiIT` pass.
- [x] 1.5 Add videos to posts (design D6). Add `PostVideoApiIT` covering every scenario of the `post/posts` delta; verify it and the existing post tests pass.
- [x] 1.6 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Front-end

- [x] 2.1 Add `uploadVideo` and `VideoField` with `en` and `uk` strings. Add Vitest tests covering every scenario of spec `media/video-field`; verify they pass.
- [x] 2.2 Add the field and players to reviews, with `en` and `uk` strings. Add Vitest tests covering the `review/review-form` and `review/site-reviews` deltas; verify they and the existing review tests pass.
- [x] 2.3 Add the field and players to posts, with `en` and `uk` strings. Add Vitest tests covering the `post/editor` and `post/pages` deltas; verify they and the existing post tests pass.

## 3. Integration

- [x] 3.1 Add ADR-0011 and its row in `docs/adr/README.md`, and update the media section of `docs/ARCHITECTURE.md` and the upload limit comment in `frontend/nginx.conf`; verify against design D1-D4.
- [x] 3.2 On the running stack, in a browser at 1280 px and 375 px, in `en` and `uk` and both themes, with real clicks where the page allows: upload a real MP4 of over 11 MB through a review form and a post editor, play and seek it on the review card and the post page as an anonymous visitor, confirm a 206 through nginx, and remove it. Fix any gaps; verify with screenshots.
- [x] 3.3 Run `pnpm smoke:stack`, because `nginx.conf` changed, and confirm it exits 0.
- [x] 3.4 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [x] 3.5 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/add-video-media/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-video-media` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
