# Tasks

## 1. Storage and schema

- [x] 1.1 Add `V6__create_media.sql`, the `media.domain` entity `Media` and its repository (design D1). Add `MediaRepositoryIT` checking the content-type and size constraints and the partial index; verify it passes.
- [x] 1.2 Add `MediaStorage` and `LocalDiskMediaStorage` with `divenet.media.dir` (design D3). Add `LocalDiskMediaStorageTest` (unit, temporary directory) covering write/read/delete, the two-character subfolder, and that a reader never sees a partial file; verify it passes.

## 2. Validation and thumbnails

- [x] 2.1 Add the `imageio-webp` dependency with its version pinned in `backend/pom.xml` properties; verify `mvnw verify` still passes on a clean build.
- [x] 2.2 Add the image inspector and thumbnail maker in `media.service` (design D4). Add `ImageProcessorTest` (unit, fixture images generated in the test) covering "JPEG upload" dimensions, "PNG and WebP uploads", "GIF", "Other file type with an image name", "Image sent with a wrong content type", "Corrupt image", "Too many pixels" (header-only, no decode), "Large image is scaled down", "Small image is not enlarged" and "Transparent PNG"; verify it passes.

## 3. Upload, serving and lifecycle API

- [x] 3.1 Add `MediaService.upload`, the exceptions, `MediaController` and `MediaFileController`, the `GET /media/**` security rule, the `handleMissingServletRequestPart` override and the multipart and swallow limits (design D2, D3). Add `MediaApiIT` covering every scenario of "Signed-in users upload images", "Only supported images are accepted" (including 413 for 10 MB plus one byte) and "Media is served to everyone", and checking that a refused upload leaves no row and no file; verify it and `LayeredArchitectureTest` pass.
- [x] 3.2 Add `MediaService.attach` and `release` (design D5). Add `MediaServiceIT` covering "Own unattached uploads", "Another user's upload", "Upload already attached", "Unknown id" and "Released upload is gone"; verify it passes.
- [x] 3.3 Add `SchedulingConfig` and `MediaCleanup` (design D6). Add `MediaCleanupIT` with a fixed `Clock` covering "Old unattached upload", "Recent unattached upload" and "Old attached upload"; verify it passes.
- [x] 3.4 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`, and that the `/media` file routes are not in the snapshot.

## 4. Stack

- [x] 4.1 Mount the `media-data` volume and set `MEDIA_DIR` in `compose.yaml`, create `/data/media` in `backend/Dockerfile`, and raise `client_max_body_size` to `11m` in `frontend/nginx.conf` (design D8). Add the media-volume rule to `scripts/compose-rules.mjs` with a case in `compose-rules.test.mjs` covering "Media directory is on a named volume"; verify the test passes and that removing the mount fails the compose step, naming `backend`.
- [x] 4.2 Extend `scripts/smoke-stack.mjs`: register and log in, upload the 10 MiB JPEG through the web port, check "Media error comes from the back-end", "Upload at the size limit passes the web server" and "Restart keeps an upload". Add unit cases for the new helpers to `smoke-stack.test.mjs`; verify they pass.
- [x] 4.3 Proxy `/media` in `frontend/vite.config.ts`; verify an uploaded image loads through the dev server.

## 5. Front-end

- [x] 5.1 Add `src/api/media.ts` with `uploadMedia` (design D7). Add Vitest tests with MSW checking that it sends multipart with the bearer token, retries once after a refresh on 401, and rejects with `ApiError` carrying the status; verify they pass.
- [x] 5.2 Add `components/PhotoField` with its CSS module (tokens only) and the `media.photoField` strings in `en` and `uk` (design D7). Add Vitest tests with MSW covering every scenario of `media/photo-field`; verify they pass.
- [x] 5.3 Render `PhotoField` in a local harness that is not committed, against the dev server and API, in both languages and both themes, at desktop and phone width; compare with the Photos field of `design/screens/ReviewForm.html`, fix any gaps and verify with screenshots. Remove the harness.

## 6. Integration

- [x] 6.1 Update `docs/ARCHITECTURE.md`: the `media` table in the existing-tables sentence and ER diagram, 413 and 415 in the API status codes, and the media directory in the system-context notes; verify the diagram matches `V6__create_media.sql`.
- [x] 6.2 Run `pnpm smoke:stack`, because `compose.yaml`, a Dockerfile and `nginx.conf` changed; verify it exits 0.
- [x] 6.3 Run `pnpm check` from the repository root and confirm it exits 0.
- [x] 6.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-media-uploads` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
