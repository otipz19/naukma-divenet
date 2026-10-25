# 0006. Local-disk media behind MediaStorage

Status: Accepted
Date: 2026-10-25

## Context
Reviews, posts, sites and profiles carry photos. The project is demonstrated
locally; object storage adds an extra service to run.

## Decision
Store files on local disk (a Docker volume in Compose) behind a `MediaStorage`
interface, with metadata in the database. Accept JPEG, PNG and WebP up to 10 MB,
validated by content. Generate a thumbnail on upload. Serve via the back-end.

## Consequences
- Single-node only; acceptable for the project.
- MinIO can replace the implementation later (stretch item `add-object-storage`).
