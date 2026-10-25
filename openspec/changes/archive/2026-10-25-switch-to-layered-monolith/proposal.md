# Proposal

## Why

ADR-0002 made the back-end a Spring Modulith modular monolith. The agent chose
this when it wrote the project docs; the team never discussed it. The team prefers
a plain layered Spring monolith: less ceremony (no closed modules, no
events-only rule for cross-feature calls), and a structure every teammate and
agent already knows. Only the `shared` package exists so far, so switching now
costs almost nothing. After `add-reference-data` and `add-dive-site-catalog` land,
it would mean rewriting features.

## What Changes

- Remove Spring Modulith from the back-end: its dependencies and BOM, the
  `@ApplicationModule(type = OPEN)` annotation on `shared`, and `ModularityTest`.
- Keep feature packages, each organised by layer:
  `ua.ukma.divenet.<feature>.{web,service,domain}`, plus `shared` for
  cross-cutting infrastructure.
- Add one ArchUnit test (`LayeredArchitectureTest`) that enforces the layer
  direction inside features, `web → service → domain`, and that web code never
  touches entities or repositories. It runs in `mvnw verify`, and so in `pnpm check`.
- Relax the cross-feature rules in `docs/ARCHITECTURE.md`:
  - A feature may call another feature's services directly.
  - Entities may hold JPA relations to other features' entities.
  - Application events stay as an option, recommended for fan-out side effects
    such as achievements, but are no longer required.
- Add ADR-0008 "Plain layered monolith", and mark ADR-0002 `Superseded by 0008`.
- Update every other mention of Modulith:
  - AGENTS.md (gate description);
  - `openspec/config.yaml` (stack context);
  - the `scripts/check.mjs` step comment;
  - the ARCHITECTURE.md testing table.
- Add this change to `docs/ROADMAP.md` (M0, after `bootstrap-backend`).
- **Boundary files:** this edits `scripts/check.mjs` (a comment only) and
  `openspec/config.yaml`, which need your approval. Approving this proposal
  approves those edits.

Stories covered: none. This is an architecture change. Departure from
`docs/ARCHITECTURE.md`: yes, recorded by ADR-0008.

Out of scope:
- A cycle check between features (ArchUnit `slices().beFreeOfCycles()`). It is
  left out deliberately; the design explains why.
- Any change to API behaviour, errors, pagination, health or the database
  baseline.
- Rewriting the archived `bootstrap-backend` artifacts. They stay as history.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No externally observable behaviour changes. The change is a build and
architecture refactor, so `.openspec.yaml` sets `skip_specs: true`.

## Impact

- `backend/pom.xml`: Modulith dependencies, BOM and property removed;
  `com.tngtech.archunit:archunit-junit5` (test scope) added with a pinned version,
  because the Boot BOM does not manage it.
- `backend/src/main/java/ua/ukma/divenet/shared/package-info.java`: the Modulith
  annotation is removed; the Javadoc stays.
- `backend/src/test/java/ua/ukma/divenet/`: `ModularityTest` is deleted and
  `LayeredArchitectureTest` is added.
- Docs: `docs/adr/0008-layered-monolith.md` (new), `docs/adr/0002-modular-monolith.md`
  (status line only), `docs/adr/README.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`,
  `docs/ROADMAP.md`, `docs/HANDOFF.yaml`.
- Tooling: `openspec/config.yaml` and the `scripts/check.mjs` comment.
- `api/openapi.json` is unchanged. The OpenAPI snapshot check must stay green
  without regenerating it.
- Depends on `bootstrap-backend` being committed. Apply it on its own branch,
  `change/switch-to-layered-monolith`, cut from that commit.
