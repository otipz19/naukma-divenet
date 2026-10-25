# Working agreement

These instructions are shared by every coding agent working in this repository:
Claude Code (`CLAUDE.md`), Gemini CLI (`GEMINI.md`) and Codex (this file).
Agent-specific files only import this one.

## Mission and scope

DiveNet is a social platform for scuba divers. It has a dive-site map with search
and filters, reviews and ratings, site warnings, a dive log, profiles with
certificates and achievements, and blog posts with feeds. The UI is in English
and Ukrainian. This is a university project, built entirely by agents. It must be
demonstrable as a complete, working product, not a market product.

Out of scope: route building, offline sync, real-time push, OAuth and email
flows, payments, native apps. The full list is in [docs/PRODUCT.md](docs/PRODUCT.md#scope).

## Source of truth

When two sources disagree, the one higher in this list wins:

1. The user's instructions in the current session.
2. `openspec/specs/`: the behaviour that exists. This folder grows only through
   archived changes.
3. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/adr/](docs/adr/README.md):
   project-wide rules. Sections marked **(planned)** describe code that is not built yet.
4. The active change in `openspec/changes/<id>/`: the plan for the current work.
5. [docs/ROADMAP.md](docs/ROADMAP.md): the order of work and each item's status. This is a plan.
6. [docs/PRODUCT.md](docs/PRODUCT.md): scope, domain decisions and the backlog
   of what is wanted.
7. UI design: `docs/DESIGN.md` **does not exist yet**. It is planned and will be
   produced with Claude Design. Once it exists, it wins over existing UI code for
   visual decisions. Until then, keep styling minimal.

If an archived spec and PRODUCT.md disagree, the spec says what exists and
PRODUCT.md says what is wanted. Raise it with the user; do not pick one silently.

## Code and document map

| Area | Path | Owns | Checks |
| --- | --- | --- | --- |
| Product | [docs/PRODUCT.md](docs/PRODUCT.md) | Scope, domain decisions, user stories (US-xx) | — |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/adr/](docs/adr/README.md) | Modules, API conventions, security, testing strategy | — |
| Roadmap | [docs/ROADMAP.md](docs/ROADMAP.md) | Ordered OpenSpec change IDs and their status | — |
| OpenSpec | [openspec/config.yaml](openspec/config.yaml), `openspec/specs/`, `openspec/changes/` | Change proposals, designs, tasks, spec deltas | `openspec validate --all --strict` (part of `pnpm check`) |
| Quality gate | [scripts/check.mjs](scripts/check.mjs), [.github/workflows/check.yml](.github/workflows/check.yml) | The single check command and CI | `pnpm check` |
| Back-end | `backend/` | Spring Boot layered monolith; feature packages under `ua.ukma.divenet` (ADR-0008) | `backend/mvnw verify` (part of `pnpm check`) |
| Front-end | `frontend/` | React SPA, i18n `en`/`uk`, typed API client | front-end steps of `pnpm check` |
| API contract | `api/openapi.json` | REST contract shared by back-end and front-end | `ApiContractTest`; front-end types check `api:types:check` |
| Design | `docs/DESIGN.md` (planned) | UI source of truth; consult it before any UI change once it exists | — |
| Session state | [docs/HANDOFF.yaml](docs/HANDOFF.yaml) | What is done, in progress and next | — |

## How work happens

All feature work goes through OpenSpec, in the order set by `docs/ROADMAP.md`:

1. Read `docs/HANDOFF.yaml`, then pick the next roadmap item as described in
   [docs/ROADMAP.md](docs/ROADMAP.md#how-to-use-this-file).
2. Propose: `/opsx:propose <change-id>` in Claude Code or Gemini, `$openspec-propose`
   in Codex. Then stop and wait for the user to review the proposal.
3. Apply: `/opsx:apply` or `$openspec-apply-change`. Implement the tasks in order,
   ticking each one off in `tasks.md` as you go.
4. Archive: `/opsx:archive` or `$openspec-archive-change`, once `pnpm check` passes.
   Update the roadmap status in the same commit.

Other commands: `/opsx:explore` (think something through before proposing),
`/opsx:update`, `/opsx:sync`. Small fixes that change no behaviour, such as docs,
tooling and typos, do not need an OpenSpec change.

Git: work on a branch named `change/<change-id>` (or `fix/<topic>`) and open a PR
to `master`. `master` is protected: changes land only through a PR with a green
`check` job. Commit messages are imperative, in English, and name the change ID.
Do not push or merge unless the user asks.

## Working rules

- Code, comments, identifiers, commit messages and docs are in English only.
  Ukrainian text appears only in the `uk` locale file.
- Inspect before editing. Preserve unrelated and untracked work.
- Confirm with the user before any destructive action: deleting files, resetting
  or rewriting git history, dropping data.
- Before implementing, state the evidence that will show the work is done: tests,
  check output, a screenshot.
- Keep changes within the active change's scope. If you find other work that is
  needed, add it to the roadmap or report it rather than doing it.
- Follow the layer rules and API conventions in `docs/ARCHITECTURE.md`. If a
  change must depart from them, write an ADR and update `docs/ARCHITECTURE.md` in
  the same PR.
- Every spec scenario gets an automated test. Never skip, disable or weaken a test
  or check to make the gate pass.
- When review or a bug shows that an agent was missing a rule, add that rule here,
  or add a check.

## Boundaries

Do not edit these without asking the user:

- `.github/workflows/`, `scripts/check.mjs`, `package.json`, `pnpm-lock.yaml`,
  `pnpm-workspace.yaml`.
- Files generated by OpenSpec: `.claude/skills/openspec-*`, `.claude/commands/opsx/`,
  `.gemini/skills/openspec-*`, `.gemini/commands/opsx/`, `.agents/skills/`. Regenerate
  them with `openspec update` instead of editing them by hand.
- `openspec/changes/archive/`: archived changes are history.
- Accepted ADRs in `docs/adr/`: supersede them with a new ADR instead of editing them.
- Merged Flyway migrations in `backend/src/main/resources/db/migration/`: add a
  new `V<n>__<name>.sql` instead of editing one.
- `api/openapi.json` and `frontend/src/api/schema.gen.ts`: never edit by hand; regenerate them (see Checks).
- Rules for `.env` files are in `docs/ARCHITECTURE.md`. Once `add-local-stack`
  creates them, add them to this list.

## Checks

The single gate, run from the repository root:

```sh
pnpm install
pnpm check
```

It runs, in order:
1. `openspec validate --all --strict`.
2. Front-end (`frontend/`, Node only), one step each: i18n key parity
   (`en`/`uk`), generated API types match `api/openapi.json`, `tsc` typecheck,
   ESLint (including the ban on hard-coded JSX text), Prettier check, Vitest
   tests, and the Vite production build.
3. `backend/mvnw verify`: compile, unit tests, integration tests against a
   Testcontainers PostGIS, the ArchUnit layer check (`LayeredArchitectureTest`),
   the OpenAPI snapshot check (`ApiContractTest`) and Spotless.

Every step must be check-only and must exit non-zero on failure. CI
(`.github/workflows/check.yml`) runs the same command on every push to `master`
and on every PR.

Fix commands (never run by the gate):
- Back-end formatting: `cd backend && ./mvnw spotless:apply`.
- Front-end formatting: `pnpm --filter @divenet/frontend exec prettier --write .`
- OpenAPI snapshot, after any API change:
  `cd backend && ./mvnw test -Dtest=ApiContractTest -Dopenapi.update=true`,
  then the front-end types: `pnpm --filter @divenet/frontend api:types`.
  Commit the regenerated `api/openapi.json` and `frontend/src/api/schema.gen.ts`
  with the change.
- Run the API locally on a throwaway database: `cd backend && ./mvnw spring-boot:test-run`.
- Run the front-end dev server (proxies `/api` to the API above):
  `pnpm --filter @divenet/frontend dev`.

Prerequisites:
- Node.js 24 or newer, and pnpm (`npm i -g pnpm`; recent Node versions no longer ship corepack).
- The OpenSpec CLI on PATH: `npm i -g @fission-ai/openspec@1.15.0`. The agent
  skills call `openspec` directly. `pnpm check` uses the copy pinned in `package.json`.
- JDK 25 or newer, and a running Docker daemon (Testcontainers; Compose later).
  Maven itself is not needed: use `backend/mvnw` (`mvnw.cmd` on Windows).

Not covered yet: E2E (M6).

## Handoff

`docs/HANDOFF.yaml` holds the state that survives a context reset. Read it before
starting. Update it after every verified step and before any long or risky one.
Keep it a snapshot, not a log: references, not content; under 40 lines; with
`next` always set. History lives in git.
