# Proposal: add-object-storage

## Why

Media lives on the back-end's local disk, so the back-end cannot run as more than one instance, and its container holds state. ADR-0006 planned MinIO as the replacement, and the roadmap has `add-object-storage` as a stretch item. With videos now allowed, files are larger, and object storage is the natural place for them.

## What Changes

- A MinIO implementation of `MediaStorage`, chosen by `divenet.media.storage` (`local` or `minio`). Local disk stays the default for tests and `spring-boot:test-run`.
- A `minio` service in the compose stack: a pinned image, a health check, data on a named volume, and no published port. The back-end waits for it, uses one private bucket created at startup, and no longer mounts a media volume.
- `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` in `.env.example`, and compose refuses to start without the password.
- Media is still served by the back-end from `/media/{id}`, with range requests, so no URL, API or front-end code changes.
- The compose check and its rules learn the new service.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `media/uploads`: media can be kept in MinIO, with the same behaviour.
- `shared/local-stack`: the stack runs MinIO, and media survives a restart there.

## Impact

- Stories: none; `docs/PRODUCT.md` "Object storage (MinIO) instead of local disk for media".
- Back-end: `MinioMediaStorage`, a `@ConditionalOnProperty` on both implementations, the `io.minio:minio` dependency, and a Testcontainers MinIO module for tests.
- Stack: `compose.yaml`, `.env.example`, `scripts/compose-rules.mjs` and its tests, and `scripts/check-compose.mjs`. `pnpm smoke:stack` runs locally for this change.
- Docs: ADR-0012 supersedes ADR-0006's storage decision; the rest of ADR-0006 stands. `docs/ARCHITECTURE.md` changes where it describes the media store and the stack.

## Out of scope

- Moving files already in a stack's `media-data` volume into MinIO. The volume is no longer mounted but is not deleted, so its files remain recoverable (design D5).
- Presigned URLs or serving media from MinIO directly: the back-end keeps checking ids and serving `/media`.
- Streaming uploads into storage: `MediaStorage` still takes bytes, so the 50 MB heap note from ADR-0011 stands.
- A MinIO console, versioning, lifecycle rules and replication.

## Plan updates absorbed

None.

## Plan updates written

None.
