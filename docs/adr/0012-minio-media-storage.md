# 0012. MinIO for media in the stack

Status: Accepted
Date: 2026-11-03

## Context
ADR-0006 kept media on the back-end's local disk, a Docker volume in compose, and named MinIO as the later replacement. Local disk ties media to one back-end container. Videos (ADR-0011) make the files larger. MinIO's own container images are no longer published on Docker Hub, and `quay.io/minio/minio` refuses anonymous pulls.

## Decision
The compose stack keeps media in one private MinIO bucket, through a `MinioMediaStorage` implementation of `MediaStorage`. `divenet.media.storage` chooses it (`MEDIA_STORAGE=minio`); local disk stays the default outside the stack, for tests and the dev server. The back-end still serves `/media/{id}` itself, so ids stay unguessable and no URL changes.

The `minio` service uses Chainguard's build of MinIO, `cgr.dev/chainguard/minio`, pinned by digest, because the free tier publishes only `latest`. That image fails with "file access denied" as its default user, so the service runs as root. It publishes no port and is reachable only inside the compose network.

This supersedes ADR-0006's choice of local disk for the stack. ADR-0006's other decisions stand: what is accepted, thumbnails, and serving through the back-end.

## Consequences
- The back-end container holds no state, and a second instance could share the bucket.
- One more container to pull and run, from a third-party build of MinIO. Upgrading means a new digest.
- MinIO rejects requests whose clock is far from its own, so a host clock that is badly off fails the MinIO integration tests, which talk to a container from the host.
- A stack that ran before this change keeps its uploads in the old `media-data` volume, which is no longer mounted. To copy them into the bucket, with the stack running:

  ```sh
  docker run --rm -u 0 --network divenet_default -v divenet_media-data:/old \
    -e U=<MINIO_ROOT_USER> -e P=<MINIO_ROOT_PASSWORD> \
    --entrypoint sh cgr.dev/chainguard/minio:latest -c \
    'mc alias set s http://minio:9000 "$U" "$P" && for f in /old/*/*; do mc cp "$f" "s/divenet-media/$(basename "$f")"; done'
  ```

- A range request is served by reading the object from its start, which is fine inside the stack's network.
