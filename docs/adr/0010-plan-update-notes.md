# 0010. Plan-update notes for changes to other roadmap items

Status: Accepted
Date: 2026-11-01

## Context
ADR-0007 puts the order and scope of work in `docs/ROADMAP.md`. When proposing or
applying change A shows that item B must deliver more, less or differently, the agent
edited B's roadmap row, wrote a "Deferred" bullet in A's proposal, and sometimes noted
it in `docs/HANDOFF.yaml`. Roadmap items in the same milestone may run in parallel, and
then this breaks:

- A's edit and B's status update touch the same table row, so the branches conflict.
- If B was already proposed or applied, nothing makes B notice the edit; B is
  archived without it and the plan change is lost.
- A one-line cell edit says what changed, not why or what A built that B should reuse,
  so B has to rebuild that from A's code.

## Decision
- A change records each plan change for another item as a note:
  `docs/plan-updates/<target>/<source>--<slug>.md`, with front matter (`target`,
  `source`, `kind`, `stories`, `created`) and sections for what changes, why, and what
  the source already built. The format and lifecycle are in
  [docs/plan-updates/README.md](../plan-updates/README.md).
- A change edits only its own roadmap row; it adds a row only for a new item.
- The target absorbs its notes when it is proposed, lists them in `proposal.md`, makes
  the roadmap edits they ask for, and deletes them. A note that lands later is absorbed
  with `/opsx:update` before the target is archived.
- The gate step `scripts/check-plan-updates.mjs` fails on a malformed note and on an
  open note whose target is `archived` or `dropped`.

## Consequences
- Parallel branches add separate files, so they do not conflict over plan changes.
- A missed note fails the target's PR (CI checks the merge with `master`), or `master`
  itself if both PRs merged in a race. It is never lost silently.
- The plan for an item is its roadmap row plus the open notes in its folder; agents
  read both before picking or proposing it.
- Deferred bullets in proposals remain, but no longer carry plan changes for other
  items on their own, and `docs/HANDOFF.yaml` no longer carries them at all.
