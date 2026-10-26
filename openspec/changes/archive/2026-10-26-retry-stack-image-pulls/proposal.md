# Proposal

## Why

The CI job `stack` fails on PR #8 because of a transient registry error, not because
of a fault in the stack. While building `backend`, Docker Hub answered `502 Bad Gateway`
for the `eclipse-temurin:25-jdk` manifest (run 40296346230). The smoke script tries
each pull once, so a single bad response from the registry fails a required check
and blocks the merge. The real error was also buried under hundreds of lines of
pull progress output.

## What Changes

- Before it builds or starts anything, the smoke test pulls every external image the
  stack uses: the service images in `compose.yaml`, and the `# syntax=` frontend and `FROM` images of the
  Dockerfiles. Each pull is retried a bounded number of times, with a wait between
  attempts.
- When every attempt for an image fails, the smoke test fails with a message that
  names that image and gives the last registry error. Tear-down still runs.
- The build then uses the images already pulled, so the registry is not contacted
  again during `up --build`.
- Pulls run quietly, so a failure message is no longer buried under progress bars.
- No change to `compose.yaml`, the Dockerfiles, the gate or the CI workflow file.

Out of scope:
- Retrying Maven or npm downloads inside the image builds.
- Registry mirrors.
- Docker Hub login or rate limits.
- Retrying the HTTP checks.

No user stories; this is M0 tooling. Added to `docs/ROADMAP.md` after `add-local-stack`.
There is no departure from `docs/ARCHITECTURE.md`.

The change lands on the branch `change/add-local-stack`, in PR #8. `stack` is a
required check, so that PR cannot merge until the job passes. The change and its
archive merge together with `add-local-stack`, with no separate PR. If the user wants
a separate `change/retry-stack-image-pulls` PR instead, PR #8 needs a rerun or this
change merged first.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared/local-stack`: the requirement "The gate and CI verify the stack" gains two
  scenarios. A transient image pull failure is retried. A pull that keeps failing
  fails the smoke test, names the image, and still cleans up.

## Impact

- `scripts/smoke-stack.mjs`: adds a pull phase with retries before `up --build`.
- `scripts/compose-rules.mjs`: adds a helper that lists the stack's external images
  from the rendered config and the Dockerfiles.
- `scripts/smoke-stack.test.mjs` and `scripts/compose-rules.test.mjs`: new tests,
  run by `pnpm check` through the script tests step.
- `docs/ROADMAP.md` and `docs/HANDOFF.yaml`.
- CI job `stack`: the job definition is the same, but runs take a little longer when
  a pull has to be retried.
