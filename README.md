# DiveNet

DiveNet is a social platform for scuba divers. It has a dive-site map, reviews, a
dive log and blog posts. This is a NaUKMA university project, and all the code is
written by coding agents (Claude Code, Codex or Gemini CLI). We plan, review and
steer the agents.

> **Status:** planning is done and no application code exists yet. The first
> milestone is M0 (Foundation) in [docs/ROADMAP.md](docs/ROADMAP.md).

## 1. One-time setup

Install:

| Tool | Version | Why |
| --- | --- | --- |
| Git | any recent | — |
| Node.js | 24+ | repository tooling, front-end |
| pnpm | 12+ | `npm i -g pnpm` (recent Node versions no longer include corepack) |
| OpenSpec CLI | 1.15.0 | `npm i -g @fission-ai/openspec@1.15.0`; the agent commands call `openspec` |
| JDK | 25+ | back-end (from M0 on) |
| Docker Desktop | any recent | PostgreSQL/PostGIS, Testcontainers, Compose (from M0 on) |
| An agent | — | Claude Code, Codex or Gemini CLI |

Maven is not needed. The back-end will use the Maven Wrapper (`backend/mvnw`).

Then clone the repository, install the tooling and run the checks:

```sh
git clone https://github.com/otipz19/naukma-divenet.git
cd naukma-divenet
pnpm install
pnpm check        # must print "All checks passed."
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
docs/                product, architecture, roadmap, ADRs, handoff
openspec/            OpenSpec config, specs (built behaviour), changes (in progress)
scripts/check.mjs    the single quality gate: `pnpm check`
.github/workflows/   CI running `pnpm check`
backend/             Spring Boot API         (created in M0)
frontend/            React + Vite SPA        (created in M0)
```

## Running the app

This section is not available yet. The `add-local-stack` change (M0) will add the
`docker compose up` instructions here.
