# Proposal

## Why

Reviews (US-04), profiles (US-11) and posts (US-12) all carry photos, and ARCHITECTURE.md
and ADR-0006 already fix how media works. Nothing implements it yet. This change builds the
shared media feature once, so `add-site-reviews`, `add-diver-profile` and `add-posts` can
attach photos without each building its own upload.

## What Changes

- Add `POST /api/v1/media` (authenticated, multipart): accepts one JPEG, PNG or WebP image
  of up to 10 MB, checks the type from the file's bytes, makes a thumbnail and returns the
  media's id and URLs.
- Add public `GET /media/{id}` and `GET /media/{id}/thumb`, served by the back-end with
  long cache headers.
- Add `MediaStorage` with a local-disk implementation (ADR-0006), and a `media` table that
  holds the metadata and the uploader.
- Add `MediaService.attach` and `MediaService.release`, which later features call to claim
  a user's uploads for their content or to give them up. A scheduled job deletes uploads
  that were never attached and are older than 24 hours.
- Add a shared front-end `PhotoField` component (the Photos field of
  `design/screens/ReviewForm.html`): pick photos, upload them, show thumbnails, remove them,
  and show errors. No page uses it until `add-site-reviews`.
- Stack: a named `media-data` volume for the back-end, `/media` proxied in the Vite dev
  server, and the nginx body limit raised to fit a 10 MB file plus multipart overhead.
- Add the back-end dependency `com.twelvemonkeys.imageio:imageio-webp`, because the JDK's
  ImageIO cannot read WebP (design D4). This edits `backend/pom.xml`.

Out of scope or deferred:

- Linking media to content (`review_media`, `post_media`, `site_media`, avatars): the
  change that adds each kind of content (`add-site-reviews`, `add-diver-profile`,
  `add-posts`).
- Showing photos on the site page: `add-site-reviews`.
- Video: the stretch item `add-video-media`. Object storage: the stretch item `add-object-storage`.
- Removing EXIF metadata (such as GPS position) from originals, and turning thumbnails
  to match the EXIF orientation (design, Risks).
- Per-user upload quotas and rate limits.
- Demo photos: `complete-demo-seed`.

This change covers no user story by itself; it is the shared part of US-04, US-11 and US-12.
There is no departure from `docs/ARCHITECTURE.md`, so no new ADR. The upload's 413 and 415
statuses are additions to the list of status codes in its API conventions, which this change
updates.

## Capabilities

### New Capabilities

- `media/uploads`: uploading images, their validation, thumbnails, serving, attaching to
  content and cleanup of unattached uploads.
- `media/photo-field`: the front-end component that uploads photos for a form.

### Modified Capabilities

- `shared/local-stack`: the web server also proxies `/media/`, and uploaded media survives a
  restart of the stack.

## Impact

- **Database:** migration `V6__create_media.sql`.
- **Back-end:** new `media` package (`web`, `service`, `domain`); `SecurityConfig` permits
  anonymous `GET /media/**`; scheduling enabled; multipart limits and the storage directory in
  `application.yaml`; the new WebP reader dependency in `backend/pom.xml`; `backend/Dockerfile`
  creates the media directory owned by the app user.
- **API:** one new endpoint in `api/openapi.json` and `frontend/src/api/schema.gen.ts`. The
  `/media` file routes are outside `/api/v1`, so they are not in the snapshot.
- **Front-end:** new `components/PhotoField`, an upload helper in `src/api/`, `en` and `uk` strings,
  `/media` proxy in `vite.config.ts`.
- **Stack:** `compose.yaml`, `frontend/nginx.conf`, `scripts/compose-rules.mjs` and its test,
  `scripts/smoke-stack.mjs` and its test.
- **Docs:** `docs/ARCHITECTURE.md` (media table, status codes), `docs/ROADMAP.md`, `docs/HANDOFF.yaml`.
