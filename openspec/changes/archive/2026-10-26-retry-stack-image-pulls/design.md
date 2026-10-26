# Design

## Context

`scripts/smoke-stack.mjs` begins with `docker compose up --build --wait`. That one
command pulls `postgis/postgis` and makes BuildKit fetch the Dockerfile base images:
`eclipse-temurin:25-jdk`, `eclipse-temurin:25-jre`, `node:24-alpine` and
`nginx:1.29-alpine`. On run 40296346230, one manifest request to Docker Hub returned
502. `mustRun` threw an error carrying the whole of stderr, which was mostly pull
progress bars. The smoke test failed and tore the stack down correctly.

`scripts/compose-rules.mjs` already has `baseImages(dockerfileText)`, which skips
stages built on an earlier stage. `scripts/check-compose.mjs` already renders the
config and reads the Dockerfiles.

## Goals / Non-Goals

**Goals:**
- A short registry outage while pulling an image no longer fails the job.
- When a pull really fails, the failure names the image.

**Non-Goals:**
- Making the image builds themselves robust to network errors (Maven, npm).
- Changing how `pnpm check` or the compose files behave.

## Decisions

### D1. A separate pull phase before `up --build`
The smoke test first renders the config with `docker compose config --format json`.
From it, it collects the images of services that have no `build` section, and the
`baseImages` of each service's Dockerfile, without duplicates and in a stable order.
It then pulls each one with `docker pull -q <image>`. The list comes from a new pure
helper in `compose-rules.mjs`, `externalImages(config, dockerfiles)`, so it can be
unit-tested. The Dockerfile-reading code moves out of `check-compose.mjs` so that
both scripts share it.

Alternative: retry the whole `up --build`. Rejected. It would also retry real build
failures, each retry rebuilds for minutes, and it still mixes pull noise into the
error.

Alternative: retry `docker compose pull` alone. Rejected. It skips services that
have a `build` section, which is exactly where the failing base image comes from.

### D2. Retry policy
Each image gets at most 3 attempts, with waits of 10 s and then 30 s between them.
Every failure is retried. Telling a transient error from a wrong tag would mean
parsing registry messages, which is fragile, and a wrong tag costs only 40 s
before it is reported. After the last attempt the smoke test fails with
`could not pull <image> after 3 attempts`, followed by the last stderr. The
failure goes through the existing `catch`/`finally`, so tear-down still runs. The
wait is injected so that tests do not sleep.

### D3. The build reuses the pulled images
`up --build` runs without `--pull`. With the default `docker` build driver, BuildKit
resolves a `FROM` image from the local image store when it is there, so it does not
contact the registry again. Images are still pinned by tag (requirement "Image
versions are pinned"), so the image pulled is the one the build would have
fetched.

### D4. Injected runner for `docker pull`
`runSmoke` gains an `options` argument: `{ pull, sleep, images }`. `main()` supplies
the real `docker pull` runner, `setTimeout`, and the image list. The `docker
compose` runner stays as it is. Tests pass fakes to check the retry behaviour and
the order of calls: no `up` is called before every pull has succeeded, and `down -v`
is always called last.

## Risks / Trade-offs

- **BuildKit may still contact the registry for a `FROM` image** (for example, with
  a different builder or image store). → Verify locally that `up --build` succeeds
  after the pull phase while the build logs show no `load metadata` network fetch.
  If the registry is still contacted, record it in the implementation notes and
  stop to ask before widening the scope.
- **Rate limits (429) outlast 40 s of waiting.** → They are out of scope (see
  proposal). The failure message now names the image, so a rate limit is easy to
  recognise.
- **The job gets slower when the registry is down.** → At most 40 s per image,
  well inside the job's `timeout-minutes: 30`.

No REST endpoints, Flyway migrations or i18n namespaces change.

## Implementation notes

- **The `# syntax=` frontend is an image too.** Both Dockerfiles start with
  `# syntax=docker/dockerfile:1`, and BuildKit resolves that image on every build.
  `externalImages` therefore also lists each Dockerfile's `# syntax=` image (new helper
  `syntaxImage`). The stack pulls 6 images: `docker/dockerfile:1`,
  `eclipse-temurin:25-jdk`, `eclipse-temurin:25-jre`, `postgis/postgis:17-3.5`,
  `node:24-alpine` and `nginx:1.29-alpine`. The Dockerfiles are unchanged.
- **D3 verified, so the build does not contact the registry for pulled images.**
  Locally (Docker 29.7.2, `docker` driver, containerd image store), images tagged
  under the non-existent registry `probe.invalid` built without error. One was used
  as a `FROM` image and the other as a `# syntax=` frontend. So BuildKit takes both
  from the local image store and does not contact a registry.
- **Order.** `docker compose config --format json` lists services alphabetically, so
  images are pulled in the order backend, db, web.
