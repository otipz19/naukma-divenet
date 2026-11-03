# Design: add-object-storage

## Context

`MediaStorage` has three methods: `write(key, bytes)`, `read(key)` returning an optional `Resource`, and `delete(key)`. `LocalDiskMediaStorage` is the only implementation, a `@Component` reading `divenet.media.dir`. `MediaFileController` returns the `Resource` in a `ResponseEntity`, which is how Spring MVC answers range requests. Compose mounts the `media-data` volume at `MEDIA_DIR`, and `scripts/compose-rules.mjs` enforces that mount, the service list, the start order and pinned images. `pnpm smoke:stack` checks that an upload survives a restart.

## Goals / Non-Goals

Goals: the stack keeps media in MinIO, with no change visible to clients.

Non-goals: see the proposal's out of scope.

## Decisions

### D1. A property picks the implementation

`divenet.media.storage` is `local` (the default, `matchIfMissing`) or `minio`, through `@ConditionalOnProperty` on each class. Tests, `spring-boot:test-run` and the dev server keep local disk, with no new container in every test run. Only the compose stack, and the tests that exercise MinIO, use MinIO.

Settings: `divenet.media.minio.endpoint`, `access-key`, `secret-key` and `bucket` (default `divenet-media`), bound from `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY`.

### D2. The MinIO Java SDK, one private bucket

The `io.minio:minio` client, at a pinned version, because MinIO is what ADR-0006 names. The constructor creates the bucket when missing, with no policy, so it stays private. The back-end fails to start when MinIO is unreachable, which compose orders around with a health check.

- `write`: `putObject` of the bytes. An S3 put is atomic, which keeps the interface's promise that a reader sees all of a file or none of it.
- `read`: `statObject`, returning empty on `NoSuchKey`. This gives `MediaFileController` its existing 404 path.
- `delete`: `removeObject`, which already does nothing when the key is missing.

Keys keep the local format (`{id}` and `{id}.thumb.jpg`), with no folder prefix, as object names have no folder limit.

### D3. A re-readable resource keeps range requests working

Spring MVC answers a range only for a resource that is not an `InputStreamResource`, and it needs `contentLength`. `read` returns a small `AbstractResource` holding the size from `statObject`, whose `getInputStream()` opens a new `getObject` each time.

shortcut: Spring serves a range by skipping from the start of the stream, so seeking far into a 50 MB video reads the bytes before it from MinIO. That is fine within the stack's network. A ranged `getObject` would need a custom handler, worth it only if seeking shows up as slow.

### D4. Compose

- The `minio` service uses `cgr.dev/chainguard/minio` pinned by digest, because `minio/minio` is gone from Docker Hub and `quay.io/minio/minio` refuses anonymous pulls. The image fails as its default user, so the service runs as root. It runs `server /data`, with `/data` on a new named volume `minio-data`.
  - Its health check is `mc ready local`, as the image bundles `mc`.
  - It publishes no port, and has no console port.
- `backend` gets `MEDIA_STORAGE=minio`, `MINIO_ENDPOINT=http://minio:9000` and the credentials, and depends on `minio` being healthy.
  - It drops `MEDIA_DIR` and the `media-data` mount, so its container holds no state.
- `MINIO_ROOT_USER` has a placeholder in `.env.example`. `MINIO_ROOT_PASSWORD` uses `:?`, like the database password, so compose refuses to start without it. MinIO itself needs at least 8 characters.
- `compose-rules.mjs`:
  - `SERVICES` gains `minio`, and the back-end depends on `db` and `minio`.
  - The media rule changes from "`MEDIA_DIR` on a named volume" to "`minio` has `/data` on a named volume, and the back-end's storage is `minio`".
  - The pinned-image rule already covers the new image.
- `check-compose.mjs` adds `MINIO_ROOT_PASSWORD` to the refused-when-missing list and `MINIO_` to the stack variable pattern. Its rule tests in `compose-rules.test.mjs` change to match.

A host clock far from Docker's makes MinIO refuse the integration tests' requests, as happened during apply; the stack itself is unaffected, since its containers share one clock.

### D5. Existing local files

A stack started before this change has its uploads in the `media-data` volume. After this change the volume is no longer mounted, and their rows answer 404. The volume is not deleted, so the files can be copied into the bucket by hand, and ADR-0012 gives the command. The demo stack is recreated from seed data, and the smoke test starts from empty volumes, so a migration job is not worth its code.

### D6. Tests

- `MinioMediaStorageIT` runs the storage contract against a Testcontainers MinIO: write, read with size, missing key, delete, and the bucket created and private.
- `MinioMediaApiIT` runs the upload, serve, range, thumbnail and release scenarios through the API, with `divenet.media.storage=minio`. It runs in its own Spring context, which is acceptable for one class.
- The existing media tests keep running on local disk, and cover the default scenario.
- `pnpm smoke:stack` proves the compose wiring and the restart scenario end to end.

## Risks / Trade-offs

- One more container in the stack, and `pnpm smoke:stack` pulls one more image.
- MinIO image availability, as above.
- Seeking reads from the start of an object (D3).

## Migration Plan

Additive code. The stack switches storage on its next `up`. Files on an old `media-data` volume need a manual copy (D5).

## Open Questions

None.
