# 0011. Videos stored as uploaded

Status: Accepted
Date: 2026-11-02

## Context
ADR-0006 accepts only images, each validated by decoding it and given a thumbnail. `add-video-media` adds short clips to reviews and posts. Doing the same for video would need `ffmpeg` in the back-end image, running a large parser over untrusted uploads, and transcoding would need a job queue, for a course project.

## Decision
Accept MP4 and WebM up to 50 MB through a separate endpoint, decided by the container signature. Store the bytes unchanged, through `MediaStorage`, with no thumbnail and no dimensions. Serve them from `GET /media/{id}`, with range requests, and let the browser draw the first frame. An image can be attached only as an image, and a video only as a video. ADR-0006 stays as it is for images, including their 10 MB limit.

## Consequences
- A file with a valid container and a codec the viewer's browser cannot decode will not play.
- An upload holds up to 50 MB in the heap, because `MediaStorage` takes byte arrays. Streaming belongs with `add-object-storage`.
- The media volume fills faster than with photos.
