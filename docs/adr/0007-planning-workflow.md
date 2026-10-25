# 0007. Planning with project docs + OpenSpec

Status: Accepted
Date: 2026-10-25

## Context
All development is done by agents. OpenSpec structures single changes (proposal,
design, tasks, spec deltas) but has no project-level product view, architecture or
ordering.

## Decision
- `docs/PRODUCT.md`: mission, scope, backlog of user stories.
- `docs/ARCHITECTURE.md` + `docs/adr/`: project-wide rules and decisions.
- `docs/ROADMAP.md`: ordered list of OpenSpec change IDs with dependencies and status.
- `openspec/specs/` grows only from archived changes and then describes the
  implemented behaviour; specs are not written up front.
- `docs/HANDOFF.yaml`: the current session state.

## Consequences
- Every change proposal cites roadmap ID and story IDs; archiving updates ROADMAP status.
- When an archived spec and PRODUCT.md disagree, the spec describes what exists and
  PRODUCT.md what is wanted; resolve by a new change or by editing PRODUCT.md.
