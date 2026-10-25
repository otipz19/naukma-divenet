# Design

## Context

The repository has no back-end code. Project-wide rules are already set in
`docs/ARCHITECTURE.md` and ADR-0001 to 0003: Java 25, Boot 4.1, Maven Wrapper,
modules under `ua.ukma.divenet`, Hibernate 7 + `hibernate-spatial`, Flyway with
`ddl-auto=validate`, Testcontainers with `postgis/postgis` and no H2,
ProblemDetail errors, `PagedModel` pagination, springdoc with a committed
snapshot, Spotless with palantir. This design records only the choices those
documents leave open. For the motivation, see `proposal.md`.

Constraints:
- `pnpm check` must stay check-only and must exit non-zero on failure (AGENTS.md).
- `master` only accepts PRs with a green `check` job, so CI must be able to run
  the new back-end step in this same PR.
- Developers work on Windows and CI runs on Ubuntu. The gate has to work on both.
- No `compose.yaml` yet (it comes in `add-local-stack`), so the database for
  local runs has to come from somewhere else.

## Goals / Non-Goals

**Goals:**
- `backend/mvnw verify` builds, formats-checks and runs every back-end test,
  including integration tests against real PostGIS.
- Later changes add a module by adding a package, a migration and tests, with no
  build or shared-config work.
- A stale OpenAPI snapshot fails the gate.

**Non-Goals:**
- Spring Security. Without it every endpoint is open, which is acceptable
  because there are no domain endpoints yet. `add-authentication` adds it.
- Production packaging (Dockerfile, layered jar): `add-local-stack`.
- Code coverage thresholds and static analysis beyond Spotless.

## Decisions

### D1. Project layout and dependency management
`backend/` is a single Maven module whose parent is `spring-boot-starter-parent`
4.1.x, with `maven.compiler.release=25`. The Boot BOM manages versions. Version
properties are pinned only for libraries outside it: Spring Modulith (imported
BOM), springdoc-openapi (the 3.x line for Boot 4), and spotless-maven-plugin with
palantir-java-format. The implementer chooses the newest release of each that
supports Boot 4.1 and Java 25, and records the versions in `pom.xml`. The Maven
Enforcer plugin requires Java 25 or newer, so an older JDK fails with a clear
message instead of a compiler error.

Main dependencies: web MVC, validation, data JPA, Flyway with
`flyway-database-postgresql`, the PostgreSQL driver, `hibernate-spatial`,
actuator, springdoc webmvc-ui, and the Spring Modulith core starter. Test
dependencies: the Boot test starter, `spring-boot-testcontainers`, the
Testcontainers PostgreSQL module, and the Spring Modulith test starter.

*Alternative:* a multi-module Maven build with one Maven module per domain
module. Rejected because ADR-0002 already enforces boundaries with Spring
Modulith inside one artifact, and multi-module builds slow agents down.

### D2. Package structure of the `shared` module
```
ua.ukma.divenet
  DiveNetApplication
  shared/
    package-info.java      @ApplicationModule(type = OPEN)
    config/                ClockConfig (UTC Clock bean), OpenApiConfig
    web/                   GlobalExceptionHandler, FieldViolation record
```
`shared` is declared an **open** module. Every other module needs its web and
config types, and Modulith would otherwise treat the subpackages `config` and
`web` as internal and reject those dependencies. Domain modules stay closed (the
default).

### D3. Error handling
`GlobalExceptionHandler` is a `@RestControllerAdvice` that extends
`ResponseEntityExceptionHandler`, so Spring's standard exceptions (404
`NoResourceFoundException`, 405, 415, unreadable body) become problem details
without custom code. Overrides:
- `handleMethodArgumentNotValid`: adds an `errors` property containing a list of
  `FieldViolation(field, message)` records. The record is not called `FieldError`,
  to avoid clashing with Spring's `FieldError`.
- `handleExceptionInternal`: fills in `instance` from the request path when it
  is missing. `type` is left as Spring's default `about:blank`, which Spring
  omits from the JSON. RFC 9457 defines an absent `type` as `about:blank`, and
  the spec says so.
- `@ExceptionHandler(Exception.class)`: logs at ERROR and returns 500 with a
  fixed `detail` ("An unexpected error occurred.").

`server.error.include-message`, `include-stacktrace` and
`include-binding-errors` are set to `never` as a second line of defence for
errors that bypass MVC.

*Alternative:* `spring.mvc.problemdetails.enabled=true` alone. Rejected because
it adds neither the `errors` list nor the 500 handling.

### D4. Pagination
The properties `spring.data.web.pageable.serialization-mode=via-dto`,
`default-page-size=20` and `max-page-size=100` set the envelope and the limits.
Controllers return `new PagedModel<>(page)`. An `@EnableSpringDataWebSupport`
annotation is deliberately not used: it would make Boot's auto-configuration
back off and ignore the size properties. Nothing in production uses it yet. A test-only controller (D7) proves the
behaviour.

### D5. Database, Flyway and configuration
- `application.yaml` sets the datasource to `${DB_URL:jdbc:postgresql://localhost:5432/divenet}`,
  `${DB_USERNAME:divenet}` and `${DB_PASSWORD:divenet}`. The local defaults
  match the `.env.example` that `add-local-stack` will add.
- It also sets `spring.jpa.hibernate.ddl-auto=validate`,
  `spring.jpa.open-in-view=false` and `hibernate.jdbc.time_zone=UTC`.
- Migration `V1__enable_extensions.sql` runs `CREATE EXTENSION IF NOT EXISTS
  postgis` and `... pg_trgm`. The `postgis/postgis` image runs as a superuser,
  so this works. A managed database would need the extensions created in advance,
  which is out of scope.
- Migration naming follows ARCHITECTURE.md. From this change on,
  `db/migration/` joins the "do not edit merged files" boundary in AGENTS.md.

### D6. Testcontainers and running locally
`src/test/java/ua/ukma/divenet/TestcontainersConfiguration` is a
`@TestConfiguration(proxyBeanMethods = false)`. It declares a
`@ServiceConnection` `PostgreSQLContainer` built from
`postgis/postgis:17-3.5`, declared compatible with `postgres`. Integration tests
`@Import` it, and Spring's test context cache shares one container across test
classes that use the same configuration.

`TestDiveNetApplication` (test classpath) runs
`SpringApplication.from(DiveNetApplication::main).with(TestcontainersConfiguration.class)`.
`./mvnw spring-boot:test-run` then starts the API on a throwaway PostGIS
container. This is the documented way to run the back-end until compose exists.

### D7. Test-only endpoints
The error, validation and pagination scenarios need endpoints that do not exist
in production. They are written as **static nested `@RestController` classes
inside the test class that uses them**, registered with `@Import`, under
`/api/v1/test-support/...`. Spring Boot's `TestTypeExcludeFilter` keeps classes
nested in tests out of component scanning. So they never load in other contexts,
and they never appear in the OpenAPI snapshot.

### D8. OpenAPI snapshot check
- `OpenApiConfig` fixes the document's `info` (title "DiveNet API", version "v1")
  and a single server `/`. This keeps the document free of ports and build
  versions. springdoc is limited to `/api/v1/**` (`springdoc.paths-to-match`).
- `ApiContractTest` (`@SpringBootTest` + MockMvc + Testcontainers) does the
  following:
  1. It fetches `/v3/api-docs`.
  2. It normalises the JSON: keys sorted recursively, two-space pretty print,
     LF line endings, trailing newline.
  3. It compares the result with `../api/openapi.json`.
  4. On a mismatch, it fails with a message naming the regenerate command.
  5. When the system property `openapi.update=true` is set, it writes the file
     and passes instead.
- Surefire forwards `openapi.update`, defaulting to `false`. The regenerate
  command, documented in README and AGENTS.md, is
  `cd backend && ./mvnw test -Dtest=ApiContractTest -Dopenapi.update=true`.
- Normalising in the test rather than relying on springdoc's key order makes the
  snapshot independent of library upgrades that only reorder keys.

*Alternative:* the `springdoc-openapi-maven-plugin`, which starts the app during
`integration-test` and downloads the document. Rejected because it needs a
running database outside Testcontainers, and it writes the file, which breaks the
check-only rule.

### D9. Module verification and formatting
- `ModularityTest` calls `ApplicationModules.of(DiveNetApplication.class).verify()`.
- `spotless-maven-plugin` runs `check` with `palantirJavaFormat` and
  `removeUnusedImports`, bound to the `verify` phase.
- `./mvnw spotless:apply` fixes the formatting. AGENTS.md documents it.

### D10. Gate and CI wiring
- `scripts/check.mjs` gains a step after `openspec`: "backend: mvnw verify". It
  runs with `cwd: "backend"`, and its command is `.\mvnw.cmd` on Windows and
  `./mvnw` elsewhere, with the arguments `-B -ntp verify`. The explicit `.\`
  prefix is needed because cmd.exe can be configured not to search the current
  directory.
- `mvnw` is committed with its executable bit set (`git update-index --chmod=+x`).
- `.github/workflows/check.yml` adds `actions/setup-java@v5` (Temurin 25,
  `cache: maven`) before `pnpm check`, and drops the M0 TODO comment.
- `ubuntu-latest` provides Docker for Testcontainers.

### D11. Health endpoint
- `management.endpoints.web.exposure.include=health`.
- `management.endpoint.health.show-details=never`, `show-components=never`, and
  `probes.enabled=false`. Otherwise the anonymous body would list the liveness
  and readiness groups. `add-local-stack` can turn probes on if it needs them.
- The DB health indicator is on by default.
- The "database unreachable" scenario runs in its own test class. That class
  owns a private PostGIS container that is not shared through the context cache,
  sets `spring.datasource.hikari.connection-timeout=2000`, stops the container
  and expects 503.

## Risks / Trade-offs

- [Boot 4.1 ecosystem: springdoc, Modulith or the palantir formatter may lag Java 25 or Boot 4.1]
  → Pin versions as described in D1. If no compatible release exists, stop and
  report it rather than downgrading Java or Boot (ADR-0001).
- [The gate now needs Docker locally, and Docker Desktop is often not running]
  → `check.mjs` lets Maven's Testcontainers error surface. README and AGENTS.md
  state the prerequisite.
- [Integration tests make the gate slower, by roughly 30–60 s per container start]
  → One shared container per configuration through the context cache. The only
  extra container is in the health-DOWN test.
- [The snapshot compares differently on Windows and Linux because of CRLF]
  → The test normalises to LF, and `.gitattributes` already forces LF for text files.
- [`shared` is an open module, so modules can depend on any of its internals]
  → Keep `shared` small: cross-cutting infrastructure only, never domain logic.
  Domain modules stay closed.
- [There is no security, so Swagger UI and every endpoint are public] → No domain
  data exists yet, and `add-authentication` closes this before any user data
  lands.

## Migration Plan

Nothing is deployed yet. Rollback means reverting the PR.
