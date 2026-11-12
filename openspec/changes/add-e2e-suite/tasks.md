# Tasks

## 1. E2E package scaffold

- [x] 1.1 Create the `e2e/` workspace package: `package.json` with pinned
  `@playwright/test` and TypeScript, `tsconfig.json`, `playwright.config.ts`
  (base URL from `DIVENET_E2E_BASE_URL`, Chromium project, trace on retry),
  and add `e2e` to `pnpm-workspace.yaml`. Verify: `pnpm install` succeeds and
  `pnpm --filter e2e exec playwright --version` prints the pinned version.
- [x] 1.2 Add `e2e/src/support/` helpers (base URL, demo credentials, login
  helper, admin credentials from env) and an empty placeholder spec; verify
  `pnpm --filter e2e exec tsc --noEmit` typechecks and Playwright runs zero
  tests successfully against a manually started stack.

## 2. Stack runner

- [x] 2.1 Write `scripts/run-e2e.mjs` following `smoke-stack.mjs`: compose
  project `divenet-e2e`, web port 18081, env copied from `.env.example` with
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` overridden, pull-with-retries, health-gated
  `up --build`, run Playwright, always `down -v --remove-orphans`; wire
  `test:e2e` in the root `package.json`. Verify: `pnpm test:e2e` against the
  placeholder spec starts a healthy stack, passes, and leaves no
  `divenet-e2e` containers or volumes (`docker compose -p divenet-e2e ps`
  is empty).

## 3. Journeys (each lands its own spec file)

- [x] 3.1 Anonymous browse journey (`e2e/src/anonymous-browse.spec.ts`): map
  page shows the seeded result list; open a seeded site; reviews are visible.
  Verify: the journey passes via `pnpm test:e2e`.
- [x] 3.2 Register → review journey (`register-review.spec.ts`): register a
  unique user, log in, submit a review with a photo on a seeded site; the
  review and photo appear and the site's average rating changes. Verify:
  journey passes; a deliberately broken selector makes it fail (checked
  once, then reverted).
- [x] 3.3 Dive log → achievement journey (`dive-achievement.spec.ts`): log in
  as a demo diver whose dive count crosses a seeded achievement target, add a
  dive entry; the entry and the unlocked-achievement banner appear. Verify:
  journey passes.
- [x] 3.4 Post → feed journey (`post-feed.spec.ts`): log in, publish a post
  linked to a region; it appears in the global feed. Verify: journey passes.
- [x] 3.5 Admin moderation journey (`admin-moderation.spec.ts`): a user
  submits a site, the admin approves it from the queue; the site becomes
  visible on the map to an anonymous visitor. Verify: journey passes.
- [x] 3.6 Session-refresh journey (`session-refresh.spec.ts`): log in, reload
  the page (in-memory token lost), open an authenticated page; the user is
  still logged in without seeing the login page. Verify: journey passes; it
  also fails as expected when run against a stack whose refresh cookie cannot
  be set (checked once on a non-localhost host or by inspection, then
  reverted/left as a manual note).

## 4. CI

- [x] 4.1 Add the `e2e` job to `.github/workflows/check.yml`: Node 24,
  install Chromium with the lockfile-hashed cache, run
  `node scripts/run-e2e.mjs`. Verify: the workflow YAML is valid and the job
  is green on the change branch's PR.

## 5. Docs and gate

- [x] 5.1 Update `README.md` (how to run `pnpm test:e2e`, prerequisites) and
  `docs/HANDOFF.yaml`; set `add-e2e-suite` to `in-progress` in
  `docs/ROADMAP.md` when starting and `archived` at the end. Verify: files
  updated and consistent.
- [x] 5.2 Run `pnpm check` from the repository root and confirm every step
  passes (the E2E suite itself is not part of the gate). Verify: green gate
  output.

## Workflow follow-up

- Sync the `shared/e2e` delta spec into `openspec/specs/`, run
  `openspec validate --all --strict`.
- Archive the change on this branch (`/opsx:archive`), set the roadmap status
  to `archived` in the same commit, then push and open the PR to `master`.
