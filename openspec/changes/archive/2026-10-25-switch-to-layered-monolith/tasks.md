# Tasks

## 0. Start

- [x] 0.1 Confirm that `bootstrap-backend` is committed. Then create `change/switch-to-layered-monolith` from that commit, and set this change to `in-progress` in `docs/ROADMAP.md`. Verify with `git log -1` and by reading the roadmap diff.

## 1. Remove Spring Modulith

- [x] 1.1 Remove the Modulith property, BOM import and both starters from `backend/pom.xml`. Remove the `@ApplicationModule` annotation and import from `shared/package-info.java`, and reword its Javadoc (design D4). Delete `ModularityTest`. Verify that `./mvnw -B -ntp -q compile test-compile` succeeds, and that `grep -ri modulith backend/src backend/pom.xml` finds nothing.

## 2. ArchUnit layer rules

- [x] 2.1 Add `com.tngtech.archunit:archunit-junit5` (test scope, pinned `archunit.version`) and `LayeredArchitectureTest` with the three predicate-defined layers from design D3 (shared excluded, optional layers). Verify that the test passes on the current code.
- [x] 2.2 Prove that the test bites. Add a temporary probe feature `ua.ukma.divenet.probe.{web,service,domain}` where the controller injects the repository; the test must fail and name that dependency. Then make the service import a `web` DTO; the test must fail again. Remove the probe and confirm that the test passes. Record both failures in the PR description.

## 3. Documentation

- [x] 3.1 Add `docs/adr/0008-layered-monolith.md` (design D5). Set ADR-0002's status line to `Superseded by 0008`, and update the table in `docs/adr/README.md`. Verify that the links resolve (`validate_setup.py --document docs/adr/README.md`).
- [x] 3.2 Update `docs/ARCHITECTURE.md`: the Modules intro, the Rules list (design D2) and the testing table row. Verify that `grep -n -i modulith docs/ARCHITECTURE.md` finds nothing.
- [x] 3.3 Update `AGENTS.md` (gate description), `openspec/config.yaml` (stack context, apply guidance) and the `scripts/check.mjs` step comment (design D5). Verify that `grep -rn -i modulith AGENTS.md openspec/config.yaml scripts/` finds nothing, and that `openspec validate --all --strict` passes.

## 4. Final verification

- [x] 4.1 Run `pnpm check` from the repository root on a clean build. Verify that it ends with "All checks passed.", that `api/openapi.json` is unchanged (`git diff --exit-code api/openapi.json`), and that the test count is the bootstrap count minus `ModularityTest` plus `LayeredArchitectureTest`. Update `docs/HANDOFF.yaml` (done, checks run, next).

## Workflow follow-up

- Run `/opsx:archive switch-to-layered-monolith`, and set the roadmap status to `archived` in the same commit.
- Open a PR from `change/switch-to-layered-monolith` to `master`. It needs a green `check` job.
