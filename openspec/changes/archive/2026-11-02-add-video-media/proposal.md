# Proposal: add-video-media

## Why

Divers want to show what a dive looked like, and a short clip does that better than a photo. `docs/PRODUCT.md` lists video attachments in reviews and posts as a stretch feature, and the roadmap has it as `add-video-media`. No user story exists for it.

## What Changes

- `POST /api/v1/media/videos` accepts MP4 and WebM up to 50 MB, checked by content. The server stores the file as it is, with no transcoding and no thumbnail.
- Video files are served from the existing `GET /media/{id}`, with range requests, so a player can seek.
- A review and a post each take up to 3 videos, through a new `videoIds` field, and answer with a `videos` list.
- A video can be attached only as a video. Avatars, certificate photos, covers, and review and post images keep refusing anything but images.
- A `VideoField` in the review form and the post editor, and native players on the review card and the post page.
- The image limit stays at 10 MB. Multipart and nginx limits rise to fit a video, so the image endpoint checks its own limit.

## Capabilities

### New Capabilities

- `media/video-field`: the form field that uploads and lists videos.

### Modified Capabilities

- `media/uploads`: video uploads and serving, and images and videos kept apart.
- `review/reviews`: reviews take videos.
- `review/review-form`: the review form offers the video field.
- `review/site-reviews`: review cards play videos.
- `post/posts`: posts take videos.
- `post/editor`: the editor offers the video field.
- `post/pages`: the post page plays videos.

## Impact

- Stories: none; `docs/PRODUCT.md` "Video attachments in reviews and posts".
- Back-end: `MediaService`, `ReviewService`, `PostService`, their controllers and entities; migration `V18__add_videos.sql`; `spring.servlet.multipart` limits; regenerated `api/openapi.json`.
- Front-end: `api/media.ts`, `VideoField`, `ReviewFormPage`, `ReviewCard`, `PostEditorPage`, `PostPage`, `en` and `uk` strings.
- Stack: `client_max_body_size` in `frontend/nginx.conf`, so `pnpm smoke:stack` runs locally for this change.
- `docs/ARCHITECTURE.md` media section, and a new ADR-0011, because ADR-0006 accepts only images. ADR-0006's decisions for images stay as they are.

## Out of scope

- Transcoding, thumbnails, posters, duration or dimension limits, and any server-side parsing of video. They would need `ffmpeg` in the image, running over untrusted files (design D1).
- Videos on sites, warnings, profiles and certificates.
- Video in post cards and feeds. Only the post page plays them.
- Upload progress bars, resumable uploads and QuickTime `.mov`.
- Moving media to object storage: `add-object-storage`.

## Plan updates absorbed

None.

## Plan updates written

None.
