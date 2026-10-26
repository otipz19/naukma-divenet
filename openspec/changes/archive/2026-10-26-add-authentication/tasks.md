# Tasks

## 1. Dependencies and schema

- [x] 1.1 Set `add-authentication` to `in-progress` in `docs/ROADMAP.md`. Add
  these dependencies to `backend/pom.xml`:
  - `spring-boot-starter-security`;
  - `spring-boot-starter-oauth2-resource-server`;
  - `spring-security-test` (test scope).

  Then add `V2__create_users_and_refresh_tokens.sql` (D2). Verify with
  `backend/mvnw verify`: `DatabaseBaselineIT` still passes, and Flyway applies
  V2 under `ddl-auto=validate`.
- [x] 1.2 Add `react-hook-form`, `zod` and `@hookform/resolvers` to
  `frontend/package.json` with exact versions, and update `pnpm-lock.yaml`
  (approved with the proposal). Verify that `pnpm install --frozen-lockfile`
  succeeds.

## 2. Accounts and tokens (back-end, `auth`)

- [x] 2.1 Add the `user.domain` entity, `Role` and `UserRepository`, and the
  `auth.domain` `RefreshToken` and `RefreshTokenRepository` (D1, D2). Add
  `shared.security`:
  - `AuthProperties`, with the 32-byte check that names `JWT_SECRET`;
  - the JWT encoder and decoder;
  - `DelegatingPasswordEncoder`;
  - the filter chain from D6;
  - the problem-detail entry point and access-denied handler.

  Add `JWT_SECRET` and the `ADMIN_*` defaults to `application.yaml` (D8).
  Tests:
  - an `ApplicationContextRunner` unit test for the scenario "Short key is
    refused";
  - `SecurityRulesIT`, which uses test-only controllers under `/api/v1/admin/`
    and `/api/v1/test-support/`, for the scenarios "Anonymous write is refused",
    "User on an admin endpoint", "Admin on an admin endpoint" and "Public reads
    stay anonymous".

  Update `ApiErrorsIT` to send its POST and DELETE requests `with(jwt())`, with
  the same assertions.
- [x] 2.2 Add `TokenService` (D3) and the refresh-token logic in `AuthService`
  (D4): issue, rotate, detect replay, revoke. Add a unit test `TokenServiceTest`
  with a fixed `Clock` for the scenario "Token lifetime" (claims `sub`, `roles`,
  and `exp` = `iat` + 900 s).
- [x] 2.3 Add `AuthController` with register, login, refresh, logout and `/me`,
  plus the DTOs, `@MaxUtf8Bytes`, the cookie helper and the exceptions (D5, D6,
  D7, D9). Cover the scenarios of `specs/auth` in `AuthApiIT` (MockMvc against
  Testcontainers):
  - register: "Successful registration", "Email already taken", "Short
    password", "Several invalid fields", "Password too long for the hash" and
    "Stored hash";
  - login: "Successful login" and "Wrong password and unknown email look the
    same";
  - tokens and cookie: "Expired token" (a token issued 20 minutes earlier),
    "Tampered token", "Cookie attributes" and "Only the hash is stored";
  - refresh: "Successful refresh", "No cookie" and "Expired refresh token" (a
    row with a past `expires_at`);
  - replay: "Replay after rotation" and "Other sessions are unaffected";
  - logout: "Logout revokes the token" and "Logout without a session";
  - current user: "Signed in" and "Anonymous".
- [x] 2.4 Add `AdminBootstrap` (D8). Add `AdminBootstrapIT` for the scenarios
  "Admin is created once" (the runner is run twice, then a login with the admin
  password) and "No admin variables". Add a unit test showing that an
  `ADMIN_PASSWORD` shorter than 8 characters fails startup.
- [x] 2.5 Add the `bearerAuth` scheme to `OpenApiConfig` (D9). Regenerate
  `api/openapi.json` (`./mvnw test -Dtest=ApiContractTest -Dopenapi.update=true`)
  and `frontend/src/api/schema.gen.ts` (`pnpm --filter @divenet/frontend
  api:types`). Verify that `backend/mvnw verify` passes, including
  `LayeredArchitectureTest`, `ApiContractTest` and Spotless, and that
  `api:types:check` passes.

## 3. Stack configuration (`shared/local-stack`)

- [x] 3.1 Add `JWT_SECRET` (required) and `ADMIN_EMAIL` and `ADMIN_PASSWORD`
  (optional) to the `backend` service in `compose.yaml`, and add placeholder
  values to `.env.example` (D8). Then update the compose scripts:
  - `scripts/check-compose.mjs`: add the scenario "Missing JWT key is rejected"
    (the env file without `JWT_SECRET` must fail and name it) and the scenario
    "Auth settings reach the back-end";
  - both compose scripts: extend their `STACK_VARIABLE` pattern with the new
    variables.

  Verify that `node scripts/check-compose.mjs` passes. Run a negative probe and
  revert it: with `JWT_SECRET` given a default in `compose.yaml`, the check
  fails and names `JWT_SECRET`. Then verify that `pnpm smoke:stack` still passes.
- [x] 3.2 Update the docs:
  - AGENTS.md "Checks", step 4: the compose step also refuses a missing JWT key;
  - ARCHITECTURE.md: the data-model note says `users` and `refresh_tokens`
    exist, and the Security section mentions the admin bootstrap variables;
  - README "Running the app": mention `JWT_SECRET` and the admin variables.

  Verify by reading the rendered Markdown.

## 4. Session and API client (front-end)

- [x] 4.1 Add `src/api/session.ts` and the bearer, refresh-and-retry `fetch`
  wrapper in `src/api/client.ts` (D10). Add a default MSW handler where
  `POST /auth/refresh` answers 401 to `src/test/server.ts`. Add Vitest tests in
  `src/api/session.test.ts` and `client.test.ts`:
  - the scenarios "Expired access token is renewed" and "Token never stored";
  - concurrent refresh calls send one request;
  - a 401 from `/auth/login` does not trigger a refresh;
  - a failed refresh sets `signedOut`.

  Verify that the existing route tests still pass unchanged.
- [x] 4.2 Call `restoreSession()` from `AppLayout` (design D10), and add the `useSession` hook
  in `src/features/auth/`. Add tests for the scenarios "Session restored on load"
  and "No session on load".

## 5. Pages and account area (front-end, `auth` and `shared/app-shell`)

- [x] 5.1 Build `TextField`, `Button` and `Alert` in `src/components/` from
  their `design/system/components/` specs and `bundle.css`, with tokens-only CSS
  modules. Add Vitest tests:
  - a label linked to its input;
  - an error setting `aria-invalid` and `aria-describedby`;
  - an alert with `role="alert"`.
- [x] 5.2 Add `LoginPage` at `/login` and `RegisterPage` at `/register`
  (`design/screens/Auth.html`), with their Zod schemas, server-error mapping, the
  `from` redirect and the signed-in guard (D10). Add the `auth.*` keys to `en`
  and `uk`. Cover these scenarios with Vitest and MSW tests:
  - login: "Successful login", "Failed login" and "Missing fields";
  - sign-up: "Password too short", "Server field error", "Email taken" and
    "Successful sign-up";
  - the guard: "Login page while signed in".
- [x] 5.3 Add `AccountArea` (signed out, signed in with the initials menu, and
  the logout action). Pass it to `AppHeader` and `NavDrawer` through the
  `account` render prop from `AppLayout` (D10). Add the `shell.account.*` keys to
  `en` and `uk`. Cover these scenarios with Vitest tests:
  - "Signed out", "Signed in", "Account menu" and "Account area in Ukrainian";
  - "Account links in the drawer" and "Log out from the drawer";
  - "Log out", including when the logout call fails.

  Also check the original drawer scenarios still pass.
- [x] 5.4 Check by eye against `design/screens/Auth.html`:
  - run the dev server with the API (`mvnw spring-boot:test-run`);
  - register, log out, log in with a wrong password, then log in;
  - do this at desktop width and at 375 px, in `en` and in `uk`, in both themes.

  Save screenshots as the evidence and attach them to the PR description.

## 6. Integration

- [x] 6.1 Run `pnpm check` and verify that it passes. Run `pnpm smoke:stack`.
  Then, against the compose stack, log in as the bootstrap admin through the web
  app and check `GET /api/v1/auth/me` returns role `ADMIN`.
- [x] 6.2 Update `docs/HANDOFF.yaml` for the finished change:
  - `last` gets the check results;
  - `negative_probes` gets the `JWT_SECRET` probe;
  - `next` points at `add-reference-data`.

## Workflow follow-up

- Sync the delta specs (`auth`, `shared/app-shell`, `shared/local-stack`) into
  `openspec/specs/`.
- Run `openspec validate --all --strict`.
- Archive on `change/add-authentication`, setting the roadmap status to
  `archived` in the same commit.
- Push the branch and open the PR to `master`.
