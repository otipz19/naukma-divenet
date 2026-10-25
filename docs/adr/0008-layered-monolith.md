# 0008. Plain layered monolith

Status: Accepted
Date: 2026-10-25
Supersedes: [0002](0002-modular-monolith.md)

## Context
ADR-0002 made the back-end a Spring Modulith modular monolith, with closed modules,
cross-module calls only through public interfaces and events, and
`ApplicationModules.verify()` in the gate. The agent that wrote the project docs
chose this as a default; the team never discussed it. The team prefers a plain
layered Spring monolith: less ceremony, and a structure every teammate and agent
knows. When this was decided, only the cross-cutting `shared` package existed,
so switching cost almost nothing.

## Decision
- One Spring Boot application with feature packages
  `ua.ukma.divenet.<feature>.{web,service,domain}`, plus `shared` for
  cross-cutting infrastructure that any package may use.
- Inside a feature, dependencies point down: `web → service → domain`. Web code
  never touches entities or repositories, and services return their own records.
- Between features there are no enforced boundaries. A service may call another
  feature's service, or use its entities and repositories, and entities may
  hold JPA relations across features. Prefer the owning feature's service.
  Application events are recommended for fan-out side effects such as
  achievements, but are not required.
- An ArchUnit test (`LayeredArchitectureTest`) enforces the layer direction in
  `mvnw verify`, and so in `pnpm check`. Spring Modulith is removed.

## Consequences
- Cross-feature code is simpler: direct service calls, JPA joins across features.
- Only the layer direction inside a feature is checked automatically. Coupling
  between features relies on convention. A cycle check between features
  (ArchUnit slices) can be added later if tangling becomes a problem.
