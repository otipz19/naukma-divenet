# Tasks

## 0. Start

- [x] 0.1 Set `bootstrap-backend` to `in-progress` in `docs/ROADMAP.md`. Change the `add-local-stack` row so it no longer claims the CI Java setup (proposal: roadmap adjustment). Verify by reading the diff.

## 1. Project scaffold

- [x] 1.1 Create `backend/` with the Maven Wrapper (`mvnw`, `mvnw.cmd`, `.mvn/wrapper/`). Set the executable bit on `mvnw` in git. Verify that `backend/mvnw -v` prints Maven and JDK 25+, and that `git ls-files -s backend/mvnw` shows mode `100755`.
- [x] 1.2 Write `pom.xml` as described in design D1: Boot 4.1 parent, release 25, the dependency list, pinned versions for Modulith, springdoc and Spotless, and an Enforcer rule for Java ≥ 25. Verify that `./mvnw -B -ntp dependency:resolve` succeeds.
- [x] 1.3 Add `DiveNetApplication` and the `shared` package with `package-info.java` declaring an OPEN application module (D2). Add `application.yaml` with the datasource env placeholders, `ddl-auto=validate`, `open-in-view=false`, UTC JDBC time zone, Actuator exposure limited to health, and `server.error.include-*=never` (D3, D5, D11). Verify that `./mvnw -B -ntp compile` succeeds.
- [x] 1.4 Configure `spotless-maven-plugin` (palantir, remove unused imports, `check` bound to `verify`), then run `./mvnw spotless:apply`. Verify that `./mvnw spotless:check` passes.

## 2. Database baseline (spec: shared/database)

- [x] 2.1 Add `TestcontainersConfiguration` (`postgis/postgis:17-3.5`, `@ServiceConnection`) and `TestDiveNetApplication` (D6). Verify that `./mvnw spring-boot:test-run` starts and `/actuator/health` answers. Record the result in the PR description.
- [x] 2.2 Add `db/migration/V1__enable_extensions.sql` (postgis, pg_trgm). Add `DatabaseBaselineIT` covering these scenarios: "Start against an empty database" (Flyway history shows V1 succeeded), "Start against an already migrated database" (a second `migrate()` runs 0 migrations), "PostGIS is available" and "Trigram similarity is available". Verify that the tests pass.
- [x] 2.3 Add `DatasourceEnvironmentIT` for "Environment overrides the datasource": start the context with `DB_URL`, `DB_USERNAME` and `DB_PASSWORD` pointing at a container, without `@ServiceConnection`, and assert the connection. Verify that the test passes.

## 3. Errors and pagination (specs: shared/api-errors, shared/pagination)

- [x] 3.1 Implement `GlobalExceptionHandler` and the `FieldError` record (D3). Add `ApiErrorsIT`, with nested test-only controllers (D7), covering "Unknown API path", "Unsupported HTTP method", "Invalid request body field", "Malformed JSON body" and "Handler throws an unexpected exception". Verify that the tests pass.
- [x] 3.2 Add `WebConfig` (`VIA_DTO` paging) and the pageable properties (D4), plus a UTC `Clock` bean in `ClockConfig`. Add `PaginationIT`, with a nested test controller paging over 25 in-memory items, covering "First page of a collection", "Size omitted" and "Size above the maximum". Verify that the tests pass.

## 4. Health (spec: shared/health)

- [x] 4.1 Add `HealthEndpointIT` covering "Healthy application" (200, `UP`, no `components`/`details`) and "Other actuator endpoints are hidden" (`/actuator/env` and `/actuator/beans` return 404). Verify that the tests pass.
- [x] 4.2 Add `HealthDatabaseDownIT`, with a private container and a short Hikari timeout (D11), covering "Database unreachable" (503, `DOWN`). Verify that the test passes and finishes within 60 s.

## 5. API contract (spec: shared/api-contract)

- [x] 5.1 Add springdoc with `OpenApiConfig` (fixed info and server, `paths-to-match=/api/v1/**`). Add `ApiContractTest`, with normalisation, comparison and the `openapi.update` write mode (D8), and forward `openapi.update` through Surefire. Cover "OpenAPI document is served", "Snapshot is current" and "Snapshot is stale": the stale case compares against a modified copy and asserts that the failure message names the regenerate command. Verify that the tests pass.
- [x] 5.2 Generate `api/openapi.json` with the regenerate command. Verify "Regenerate the snapshot": a following `./mvnw verify` passes. Verify "Gate run leaves the snapshot untouched": hand-edit the snapshot, run the test without the flag, and confirm that it fails and the file is unchanged. Restore the file afterwards.

## 6. Module boundaries

- [x] 6.1 Add `ModularityTest` (`ApplicationModules.verify()`). Verify that it passes. Then confirm that it fails when a temporary class in a probe module imports a non-exposed type, and remove the probe afterwards.

## 7. Gate, CI and docs

- [x] 7.1 Add the `backend: mvnw verify` step to `scripts/check.mjs` (platform-specific command, `cwd: backend`, `-B -ntp verify`), and update the file's header comment. Verify that `pnpm check` passes locally with Docker running. Verify that it exits non-zero when one formatting violation is introduced, and revert the violation afterwards.
- [x] 7.2 Add `actions/setup-java@v5` (Temurin 25, `cache: maven`) to `.github/workflows/check.yml`, and remove the M0 comment. Verify that the PR's `check` job is green.
- [x] 7.3 Update `docs/ARCHITECTURE.md`: remove **(planned)** from the parts that now exist (backend layout, `api/openapi.json`, the `shared` module notes), and document the open `shared` module. Verify by reading the diff against design D2.
- [x] 7.4 Update `AGENTS.md`:
  - code map: back-end and API contract rows, with real check commands;
  - checks: what the gate now runs, Docker prerequisite, `spotless:apply`, the snapshot regenerate command;
  - boundaries: merged files in `backend/src/main/resources/db/migration/`, and `api/openapi.json` only through the regenerate command.

  Verify that `validate_setup.py` (or a manual link check) passes.
- [x] 7.5 Update `README.md`: the back-end section of "Running the app" (`./mvnw spring-boot:test-run`, Swagger UI URL), and the gate prerequisites. Verify that the documented commands run as written.

## 8. Final verification

- [x] 8.1 Run `pnpm check` from the repository root on a clean tree. Verify that it ends with "All checks passed." Then update `docs/HANDOFF.yaml`: what is done, the checks that were run, and `next` = archive this change.

## Workflow follow-up

- Run `/opsx:archive`, set `bootstrap-backend` to `archived` in `docs/ROADMAP.md` in the same commit, and point `docs/HANDOFF.yaml` `next` at `/opsx:propose bootstrap-frontend`.
- Open a PR from `change/bootstrap-backend` to `master` that contains the change and its archive. The PR needs a green `check` job before it can merge.
