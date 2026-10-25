# DiveNet

DiveNet is a social platform for scuba divers. It has a dive-site map, reviews, a
dive log and blog posts. This is a NaUKMA university project, and all the code is
written by coding agents (Claude Code, Codex or Gemini CLI). We plan, review and
steer the agents.

> **Status:** M0 (Foundation) is in progress. The back-end and front-end skeletons
> exist; the UI design, app shell and compose stack come next. See [docs/ROADMAP.md](docs/ROADMAP.md).

## 1. One-time setup

Install:

| Tool | Version | Why |
| --- | --- | --- |
| Git | any recent | — |
| Node.js | 24+ | repository tooling, front-end |
| pnpm | 12+ | `npm i -g pnpm` (recent Node versions no longer include corepack) |
| OpenSpec CLI | 1.15.0 | `npm i -g @fission-ai/openspec@1.15.0`; the agent commands call `openspec` |
| JDK | 25+ | back-end |
| Docker Desktop | any recent, **running** | PostgreSQL/PostGIS for back-end tests (Testcontainers), Compose later |
| An agent | — | Claude Code, Codex or Gemini CLI |

Maven is not needed. The back-end uses the Maven Wrapper: `backend/mvnw`, or
`backend\mvnw.cmd` on Windows.

Then clone the repository, install the tooling and run the checks:

```sh
git clone https://github.com/otipz19/naukma-divenet.git
cd naukma-divenet
pnpm install
pnpm check        # must print "All checks passed." (Docker must be running)
```

## 2. Read this first (about 15 minutes)

1. [AGENTS.md](AGENTS.md): the rules every agent follows: source of truth,
   boundaries and checks. `CLAUDE.md` and `GEMINI.md` only import it.
2. [docs/PRODUCT.md](docs/PRODUCT.md): what we build, what is out of scope, and the
   user stories (US-xx).
3. [docs/ROADMAP.md](docs/ROADMAP.md): the ordered list of work items and their status.
4. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/adr/](docs/adr/README.md):
   the tech stack and the rules all code must follow.

## 3. How we work: one roadmap item = one OpenSpec change = one PR

Each piece of work is an [OpenSpec](https://github.com/Fission-AI/OpenSpec)
change. A change is a folder under `openspec/changes/<change-id>/` containing a
proposal, a design, spec deltas and a task list. The agent writes it, you review
it, then the agent implements it.

### Step by step

1. **Sync and claim an item.**
   ```sh
   git switch master && git pull
   ```
   In [docs/ROADMAP.md](docs/ROADMAP.md), pick the first `planned` item whose
   dependencies are all `archived`. **Tell the team in our chat which item you are
   taking**, so two people never work on the same change.
2. **Create a branch.**
   ```sh
   git switch -c change/<change-id>
   ```
3. **Propose.** In your agent, run:

   | Claude Code / Gemini CLI | Codex |
   | --- | --- |
   | `/opsx:propose <change-id>` | `$openspec-propose <change-id>` |

   The agent writes `proposal.md`, `design.md`, `tasks.md` and spec deltas.
   **Read them and correct them.** This is where your judgement matters most. Ask the agent
   to fix whatever is wrong, or edit the files yourself.
4. **Apply.** Run `/opsx:apply` (Codex: `$openspec-apply-change`). The agent
   implements the tasks and ticks them off. Review the code as it goes, and make
   sure `pnpm check` passes.
5. **Archive.** Run `/opsx:archive` (Codex: `$openspec-archive-change`). The
   change's specs merge into `openspec/specs/`, and the roadmap status becomes `archived`.
6. **Open a PR** to `master` that contains the change, its archive and the
   roadmap update. CI (`pnpm check`) must be green before merging.
   Direct pushes to `master` are blocked.

Two more useful commands:
- `/opsx:explore`: think a problem through with the agent before proposing.
- `/opsx:update`: revise a change's plan after you learn something new.

Small fixes that change no behaviour, such as typos, docs and tooling, can skip
OpenSpec. Use a `fix/<topic>` branch and a normal PR.

### Rules that save us pain

- **Everything is in English:** code, comments, commits and docs. Ukrainian appears
  only in the UI translation file (`uk`).
- **Every new UI string** needs both an `en` and a `uk` translation.
- **Never weaken a test or a check** to get CI green. Fix the cause instead.
- **Ask in chat before changing shared files:** CI, `scripts/check.mjs`,
  `docs/ARCHITECTURE.md`, ADRs, `AGENTS.md`, `openspec/config.yaml`.
- **Scope changed?** Edit [docs/ROADMAP.md](docs/ROADMAP.md) in your PR and say
  why. Never silently drop a user story.
- **Agent forgot a rule?** Add the rule to `AGENTS.md`, so the next agent doesn't
  forget it too.

### When you stop mid-work

Ask your agent to update [docs/HANDOFF.yaml](docs/HANDOFF.yaml): what is done,
what is half-done and what comes next. Commit it to your branch. Whoever continues
(you, a teammate, or another agent) starts from that file.

## Repository layout

```
AGENTS.md            shared agent instructions (CLAUDE.md, GEMINI.md import it)
docs/                product, architecture, roadmap, ADRs, handoff, UI design rules
design/              UI design system and screen mockups (open with `node design/serve.mjs`)
openspec/            OpenSpec config, specs (built behaviour), changes (in progress)
scripts/check.mjs    the single quality gate: `pnpm check`
.github/workflows/   CI running `pnpm check`
backend/             Spring Boot API
api/openapi.json     committed API contract (generated, never edited by hand)
frontend/            React + Vite SPA (@divenet/frontend)
```

## Running the app

The full stack (`docker compose up`) arrives with `add-local-stack`. Until then
you can run the back-end alone on a throwaway PostGIS container (Docker must be
running):

```sh
cd backend
./mvnw spring-boot:test-run      # Windows: .\mvnw.cmd spring-boot:test-run
```

- Health: <http://localhost:8080/actuator/health>
- API docs: <http://localhost:8080/swagger-ui.html>

Useful back-end commands (from `backend/`):

| What | Command |
| --- | --- |
| Fix formatting | `./mvnw spotless:apply` |
| Regenerate `api/openapi.json` after an API change | `./mvnw test -Dtest=ApiContractTest -Dopenapi.update=true` |
| Full back-end check | `./mvnw verify` |

### Front-end

The UI is not designed yet, so the app only shows a placeholder page. With the
back-end running as above, start the dev server from the repository root. It
proxies `/api` to `http://localhost:8080` (override with `DIVENET_API_URL`):

```sh
pnpm --filter @divenet/frontend dev      # http://localhost:5173
```

Useful front-end commands (from the repository root):

| What | Command |
| --- | --- |
| Fix formatting | `pnpm --filter @divenet/frontend exec prettier --write .` |
| Regenerate API types after `api/openapi.json` changed | `pnpm --filter @divenet/frontend api:types` |
| Run the tests in watch mode | `pnpm --filter @divenet/frontend exec vitest` |
