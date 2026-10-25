# Design

## Context

`bootstrap-backend` built the back-end with Spring Modulith, following ADR-0002:

- `ModularityTest` calls `ApplicationModules.verify()`;
- `shared/package-info.java` declares `shared` an OPEN module;
- the Modulith starters are in `pom.xml`.

`shared` (with its `config` and `web` subpackages) is the only package. No
feature package exists yet. For the motivation, see `proposal.md`.

## Goals / Non-Goals

**Goals:**
- No Modulith code, dependency or rule is left in the repository, apart from
  history (ADR-0002 and archived changes).
- Agents still get a build-time guard against the most common layering
  mistakes, such as a controller injecting a repository or returning an entity.
- `pnpm check` stays green, with the same API snapshot.

**Non-Goals:**
- Enforcing which features may depend on which.
- Moving to global layer packages (`controller/`, `service/`, …). The user chose
  feature packages.

## Decisions

### D1. Package layout stays feature-first
`ua.ukma.divenet.<feature>.{web,service,domain}`, with the feature names already
listed in ARCHITECTURE.md (`auth`, `user`, `geo`, `site`, …). `shared` keeps
`config` and `web`. Feature-first packages keep a feature's code together, which
helps agents working on one roadmap item. The only change from today is that the
boundaries between features are no longer enforced.

*Alternative:* global layer packages. Rejected by the user. It also scatters
every feature across five folders.

### D2. Rules between features
In ARCHITECTURE.md, the "Rules" under Modules become:
- Inside a feature: `web` → `service` → `domain`. Controllers stay thin, and
  services hold the transactions.
- `web` never touches `domain`. Services return records declared in their own
  `service` package. Controllers either return those records or map them to
  `web` DTOs. Entities are never serialised.
- A feature's `service` may call another feature's `service`, and may use
  another feature's `domain` types (entities, repositories). Entities may map JPA
  relations across features, for example `Review` → `@ManyToOne Site`.
- Prefer calling the owning feature's service over its repository, so business
  rules stay in one place. This is guidance; nothing checks it.
- Fan-out side effects, where several features feed one consumer such as
  `achievement`, should use Spring application events with
  `@TransactionalEventListener`. This is recommended, not required.
- `shared` holds cross-cutting infrastructure only. Any package may use it.

### D3. ArchUnit layer test
`LayeredArchitectureTest` (JUnit 5, `@AnalyzeClasses(packages = "ua.ukma.divenet",
importOptions = DoNotIncludeTests)`) declares `layeredArchitecture()
.consideringOnlyDependenciesInLayers()` with three layers. Each layer is defined
by a predicate that matches `ua.ukma.divenet.*.<layer>..` but **excludes
`ua.ukma.divenet.shared..`**. Without that exclusion, `shared.web` would count as
a feature web layer.

| Layer | Package | May be accessed by |
| --- | --- | --- |
| Web | `*.web..` | nobody |
| Service | `*.service..` | Web, Service |
| Domain | `*.domain..` | Service, Domain |

Because no feature package exists yet, the test also sets
`.withOptionalLayers(true)`. Otherwise ArchUnit fails on empty layers. It still
bites as soon as the first feature lands.

ArchUnit is pinned as `archunit.version` (1.5.x, the newest release that runs on
JDK 25) because the Boot BOM does not manage it.

*Alternative:* `slices().matching("ua.ukma.divenet.(*)..").should().beFreeOfCycles()`.
Left out. Under D2's relaxed rules, two-way calls between features such as
`site` and `review` are legal, and a cycle check would bring back the friction
the user wants removed. It can be added later as its own change if tangling
becomes a problem.

*Alternative:* no architecture test at all. Rejected by the user.

### D4. Removing Modulith from the build
- Remove the `spring-modulith.version` property, the `spring-modulith-bom` import,
  `spring-modulith-starter-core` and `spring-modulith-starter-test`.
- Remove the annotation and import from `shared/package-info.java`, and reword
  the Javadoc ("Cross-cutting infrastructure… any package may use it").
- Delete `ModularityTest`.
- Nothing in main code uses Modulith APIs. No `@ApplicationModuleListener`
  exists yet.

### D5. Documentation
- **ADR-0008 "Plain layered monolith"**: Context (ADR-0002 was an
  agent-introduced default; the team wants less ceremony), Decision (D1–D3),
  Consequences (simpler cross-feature code; boundaries rely on review and
  convention; the layer test guards only intra-feature direction).
- **ADR-0002**: change only its status line, to `Superseded by 0008`, as
  `docs/adr/README.md` allows. Update the index table.
- **ARCHITECTURE.md**:
  - the Modules intro sentence;
  - the Rules list, which becomes D2;
  - the testing table row, which becomes "ArchUnit `LayeredArchitectureTest`";
  - the Data model note: cross-feature foreign keys are now allowed, so no change
    is needed there.
- **AGENTS.md**: in the gate description, replace "Spring Modulith boundary
  check (`ModularityTest`)" with "ArchUnit layer check (`LayeredArchitectureTest`)".
- **`openspec/config.yaml`**: in the stack context, replace "Spring Modulith"
  with "ArchUnit layer rules". The apply-guidance line about "module boundaries"
  becomes "layer rules".
- **`scripts/check.mjs`**: in the step comment, replace "Modulith verify" with
  "ArchUnit layer rules".

## Risks / Trade-offs

- [Features tangle over time: services reach into each other's repositories, and
  dependencies become circular] → D2's guidance plus review. The cycle check
  stays available as a later change.
- [The layer test passes vacuously until the first feature exists] → Task 2.2
  proves it with a temporary probe feature that breaks a rule. The probe is
  removed afterwards.
- [ArchUnit may not yet support Java 25 class files] → Choose a release that
  does; 1.4+ reads Java 25 bytecode. If none does, stop and report it.
- [Archived `bootstrap-backend` text still mentions Modulith] → Accepted. It is
  history. ADR-0008 and ARCHITECTURE.md are the current rules.

## Migration Plan

Nothing is deployed. The change applies after `bootstrap-backend` is committed.
Rollback means reverting the PR.
