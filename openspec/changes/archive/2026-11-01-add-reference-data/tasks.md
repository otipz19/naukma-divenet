# Tasks

## 1. Countries and regions

- [x] 1.1 Check `backend/Dockerfile` and confirm that the image build does not run the test that reads the front-end locale file (design Risks); verify by reading the build command.
- [x] 1.2 Add `V3__create_countries_and_regions.sql` with the tables and rows of design D5; verify with `DatabaseBaselineIT` and the `ddl-auto=validate` startup in integration tests.
- [x] 1.3 Add `geo.domain` entities and repository, a `geo.service` read service returning records (one `join fetch` query), and the `geo.web` controller for `GET /api/v1/countries`. Add `GeoApiIT` covering spec `geo` scenarios: anonymous read, sort order, no empty country, code formats; verify the test and `LayeredArchitectureTest` pass.

## 2. Gear catalog

- [x] 2.1 Add `V4__create_gear_items.sql` with the rows of design D5; verify as in 1.2.
- [x] 2.2 Add the `site.domain` entity and repository, `site.service` read service and `site.web` controller for `GET /api/v1/gear-items`. Add `GearApiIT` covering spec `site/gear-catalog` scenarios: anonymous read and order, code format; verify the test and `LayeredArchitectureTest` pass.

## 3. Display names

- [x] 3.1 Add `en` and `uk` entries for every code under `geo.countries`, `geo.regions` and `gear` in `frontend/src/i18n/locales/`; verify with the gate's i18n parity step.
- [x] 3.2 Add `ReferenceDataLocaleIT` (design D4) covering the "Seeded codes and locale keys match" scenarios of both specs; verify it passes, and fails when a locale key is temporarily removed.

## 4. Contract and docs

- [x] 4.1 Regenerate `api/openapi.json` (`./mvnw test -Dtest=ApiContractTest -Dopenapi.update=true`) and `frontend/src/api/schema.gen.ts` (`pnpm --filter @divenet/frontend api:types`); verify with `ApiContractTest` and `api:types:check`.
- [x] 4.2 Update `docs/ARCHITECTURE.md`: list `countries`, `regions` and `gear_items` as existing tables, and add the naming rule of design D3 under Persistence; verify by review against D3.

## 5. Integration

- [x] 5.1 Run `pnpm check` from the repository root and confirm it exits 0.
- [x] 5.2 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-reference-data` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
