# Design: add-video-media

## Context

`MediaService.upload` takes a `byte[]`, runs `ImageProcessor`, and writes an original and a thumbnail through `MediaStorage`. `media` requires `width` and `height`, and its `content_type` check lists three image types. `attach` accepts any upload the user owns and has not attached, so today a video in that table could become an avatar. `MediaView` and every response give images a `thumbnailUrl`, `width` and `height`, and `PhotoField` and the cards rely on them. The 10 MB limit is enforced by `spring.servlet.multipart.max-file-size` and nginx's `client_max_body_size`. The image has no `ffmpeg`.

## Goals / Non-Goals

Goals: short clips on reviews and posts, without weakening any image guarantee.

Non-goals: see the proposal's out of scope.

## Decisions

### D1. Store as uploaded, with no processing

The server checks the container's signature and stores the bytes. Transcoding or poster frames would need `ffmpeg` in the image, which adds image size and runs a large parser over untrusted files, for a demo. The browser draws the first frame through `preload="metadata"`. The trade-off is accepted: a file with a valid container but a codec the viewer's browser cannot decode, such as HEVC in Chrome on some systems, will not play. `MediaStorage` is unchanged. ADR-0011 records this.

Signatures, read from the first bytes:

- MP4: `ftyp` at offset 4, with a brand other than `qt  `.
- WebM: the EBML magic `1A 45 DF A3`, with `webm` as the doc type within the first 64 bytes. This is what separates it from Matroska.

A forged header gets a `video/*` content type at most, which a browser will not execute. The check lives in a small `VideoSniffer` with unit tests.

### D2. A separate endpoint and a separate view

`POST /api/v1/media/videos` returns `VideoResponse { id, url, contentType }`, and `MediaResponse` keeps its required fields. No existing image response or consumer changes, whereas optional `thumbnailUrl`, `width` and `height` would ripple through every photo type in the front-end.

`media.width` and `media.height` become nullable, for videos only. `MediaView` stays image-only, and a new `VideoView` serves videos. `Media` holds them as `Integer`. A check constraint keeps them set for images.

### D3. Images and videos cannot cross

`attach(ids, userId)` gains an `image/%` filter in its update, and a new `attachVideos(ids, userId)` uses `video/%`. Both refuse with the existing `MediaNotAttachableException`, so every existing caller refuses a video without a change. This is the guarantee behind avatars, covers and certificate photos.

### D4. Limits

- `spring.servlet.multipart`: `max-file-size: 50MB`, `max-request-size: 51MB`.
- nginx `client_max_body_size 51m`.
- `MediaService.upload` refuses an image over 10 MB itself, with 413, before processing it. The existing over-limit test must keep passing, and it moves from a 10 MB+ to a limit test at both sizes.

shortcut: `MultipartFile.getBytes()` holds up to 50 MB in the heap for each upload, and only signed-in users can do it. Moving to streaming means changing `MediaStorage` to take a stream, which fits `add-object-storage`. It is noted as a code comment.

### D5. Serving

`GET /media/{id}` is unchanged. Spring MVC answers range requests for a `ResponseEntity<Resource>` itself, and a test proves it through the handler. `thumbnail` answers 404 for a video through the same missing-file path, which a test also proves. nginx proxies range requests without configuration, and the browser journey proves it on the stack.

### D6. Own join tables

`V18__add_videos.sql`: alters `media`, and adds `review_videos` and `post_videos` with the same shape as `review_media` and `post_media`. Mixing kinds in the existing tables would need a type lookup to split each list, and would change their meaning. The entities gain a second `@ElementCollection`, with `@BatchSize` on reviews to keep list queries flat. `PostService.summaries` does not touch post videos.

Update and delete follow the existing photo flow in `ReviewService` and `PostService`: attach the new ones, save, flush, release the removed ones. `release` already deletes by id, whatever the type.

### D7. Front-end

- `uploadVideo`, `MAX_VIDEO_BYTES` and `VIDEO_TYPES` in `api/media.ts`.
- `components/VideoField`: simpler than `PhotoField`, since the order of a few videos needs no parallel settling. Files upload one after another. It reuses `PhotoField`'s visual language with its own CSS module, and strings under `media.videoField.*`.
- Players are `<video controls preload="metadata" aria-label=...>`. User clips have no captions to offer, and the design has no mockup for them, so they size to the container with the tokens-only CSS.
- `ReviewFormPage` and `PostEditorPage` add the field, and `ReviewCard` and `PostPage` add players.

### D8. Endpoints

| Method and path | Access | Change |
| --- | --- | --- |
| `POST /api/v1/media/videos` | signed in | new |
| `POST`, `PUT /api/v1/sites/{id}/reviews...` and `/api/v1/posts...` | as today | `videoIds` in the request, `videos` in the response |

## Risks / Trade-offs

- Several 50 MB uploads at once can press the heap, and video fills the media volume faster than photos. Acceptable at demo scale.
- `media` files are served with a year of immutable caching, which still holds, as an id never changes content.
- Some clips, especially HEVC from phones, may not play in every browser. The player shows the browser's own error state.
- nginx buffers request bodies to disk while it proxies, so a large upload also takes temporary space in the `web` container.

## Migration Plan

Additive: nullable columns, a widened check and new tables. Existing rows satisfy the new constraints.

## Open Questions

None.
