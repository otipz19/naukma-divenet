# Tasks

## 1. Back-end

- [ ] 1.1 Add the `io.minio:minio` dependency and the Testcontainers MinIO module at pinned versions, `MinioMediaStorage` with its resource (design D2, D3), and the property switch (design D1). Add `MinioMediaStorageIT` for the storage contract; verify it, `LayeredArchitectureTest` and the existing media tests pass.
- [ ] 1.2 Add `MinioMediaApiIT` covering every scenario of the `media/uploads` delta; verify it passes.

## 2. Stack

- [ ] 2.1 Add the `minio` service, the back-end settings and `.env.example` variables (design D4). Update `scripts/compose-rules.mjs`, its tests, and `scripts/check-compose.mjs` for the `shared/local-stack` delta. Add a negative probe for each new rule: a missing `MINIO_ROOT_PASSWORD`, a published `minio` port, and MinIO data off a named volume, each failing the compose step and naming the cause. Verify `node scripts/check-compose.mjs` and the script tests pass.
- [ ] 2.2 Run `pnpm smoke:stack` and confirm it exits 0, including "the upload and its thumbnail survive a restart".

## 3. Integration

- [ ] 3.1 Add ADR-0012, with the manual copy command for an old `media-data` volume (design D5), mark ADR-0006's storage decision superseded in `docs/adr/README.md`, and update `docs/ARCHITECTURE.md` (stack table, media section, ADR-0011's heap note). Verify against design D1-D5.
- [ ] 3.2 On the running stack, in a browser, upload a photo and a video, view and seek them, and confirm with `mc ls` inside the `minio` container that the objects exist. Restart the stack and view them again. Verify with screenshots.
- [ ] 3.3 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [ ] 3.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/add-object-storage/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-object-storage` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
