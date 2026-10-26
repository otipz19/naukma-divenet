# Tasks

## 1. Image list

- [x] 1.1 Add `externalImages(config, dockerfiles)` to `scripts/compose-rules.mjs`. It returns the image of each service that has no `build` section, plus the `baseImages` of each built service's Dockerfile, deduplicated and in a stable order. Move the Dockerfile reader from `check-compose.mjs` into the same module and use it from both scripts. Add tests to `scripts/compose-rules.test.mjs` for: an image-only service, a multi-stage Dockerfile whose second `FROM` names an earlier stage, and an image shared by two services. Verify with `node --test "scripts/**/*.test.mjs"` and `node scripts/check-compose.mjs`.

## 2. Pull phase with retries

- [x] 2.1 In `scripts/smoke-stack.mjs`, give `runSmoke` an `options` argument (`pull`, `sleep`, `images`). Before `up --build`, it pulls each image with at most 3 attempts, waiting 10 s and then 30 s between them. After the last failed attempt it fails with `could not pull <image> after 3 attempts` and the last stderr. Tear-down (`down -v --remove-orphans`) still runs. `main()` renders the config, builds the list with `externalImages`, and pulls with `docker pull -q`. Add tests to `scripts/smoke-stack.test.mjs` for the scenarios "Transient image pull failure is retried" (exit 0, two pull attempts, one wait of 10 s, `up` only after the pull) and "Image pull keeps failing" (exit 1, the image named in the output, `up` never called, `down -v` called last). The existing tests must pass unchanged apart from the new argument. Verify with `node --test "scripts/**/*.test.mjs"`.
- [x] 2.2 Run `pnpm smoke:stack` locally. Confirm that it passes, that the pull phase lists the stack's images, and that `up --build` does not pull them again: the build output shows no base image download. Record the result in the design's implementation notes. If BuildKit still contacts the registry, record that and stop to ask.
- [x] 2.3 Update the header comment of `scripts/smoke-stack.mjs`, and the `stack` paragraph in `AGENTS.md` (Checks), to say that the smoke test pre-pulls the stack's images with retries. Verify that both read correctly against the code.

## 3. Wrap-up

- [x] 3.1 Add `retry-stack-image-pulls` to the M0 table in `docs/ROADMAP.md` with the status `in-progress`, and update `docs/HANDOFF.yaml`. Run `pnpm check` and verify that it passes, including the new script tests.

## Workflow follow-up

- Sync the delta spec into `openspec/specs/shared/local-stack/spec.md` and validate, then archive on the same branch (roadmap status `archived`).
- Push `change/add-local-stack` so that PR #8 picks up the fix. Then confirm that the `stack` job passes in CI.
