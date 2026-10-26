# Design

## Context

- **Back-end today:** no feature package, no security dependency, one migration
  (`V1__enable_extensions.sql`).
  - `GlobalExceptionHandler` (`shared.web`) turns exceptions into problem
    details. It already handles Spring's `ErrorResponseException` through
    `ResponseEntityExceptionHandler`.
  - `ClockConfig` provides a `Clock` bean.
  - `LayeredArchitectureTest` allows a feature's `service` to use another
    feature's `domain`.
- **Integration tests:**
  - `ApiErrorsIT` posts to and deletes on a test controller under
    `/api/v1/test-support/errors`. Once writes need a token, those calls get 401
    before they reach the controller.
  - `ApiContractTest` reads `/v3/api-docs`.
- **Front-end today:**
  - `src/api/client.ts` builds an `openapi-fetch` client with a middleware that
    throws `ApiError`.
  - `AppHeader` and `NavDrawer` live in `src/components/` and know nothing about
    features.
  - Tests use one MSW server, and any request without a handler fails the test.
- **Fixed by ADR-0004 and ARCHITECTURE.md:** the token scheme, bcrypt through
  `DelegatingPasswordEncoder`, the cookie attributes, the roles, and
  `/api/v1/admin/**` for admin endpoints.
- See proposal.md for scope and `specs/` for the behaviour.

## Goals / Non-Goals

**Goals:**
- Later features get the signed-in user with `@AuthenticationPrincipal Jwt` or a
  small `CurrentUser` helper, and admin endpoints are protected without extra
  code.
- Later features reference the user as `@ManyToOne User`.
- The front-end calls the API as before; tokens and refresh are invisible to
  feature code.

**Non-Goals:**
- Cleaning up expired refresh-token rows (see Risks).
- Protecting against a refresh race across two browser tabs (see Risks).
- Shared form components beyond what the two auth pages use.

## Decisions

### D1. Packages: `user` owns the account, `auth` owns signing in
- `user.domain`: the `User` entity, the `Role` enum (`USER`, `ADMIN`) and
  `UserRepository`. Later features (`add-diver-profile`) add profile fields and
  a `user.service` here.
- `auth.domain`: `RefreshToken` and `RefreshTokenRepository`.
- `auth.service`:
  - `AuthService` handles register, login, refresh and logout, and returns
    `AuthResult` and `UserView` records.
  - `TokenService` issues access tokens.
  - `AdminBootstrap` is an `ApplicationRunner`.
  - It uses `user.domain` directly, which ADR-0008 allows.
- `auth.web`: `AuthController`, its request and response DTOs, and the
  refresh-cookie helper.
- `shared.security`: the security filter chain, the JWT decoder and encoder
  beans, `AuthProperties`, and the problem-detail entry point and access-denied
  handler. These are cross-cutting infrastructure with no domain logic.
- *Alternative:* the `User` entity in `auth.domain`. Rejected because
  ARCHITECTURE.md gives users to the `user` package, and moving the entity later
  would touch every feature that maps it.

### D2. Schema (`V2__create_users_and_refresh_tokens.sql`)
- `users`:
  - `id bigint generated always as identity` primary key;
  - `email varchar(254) not null unique`, stored in lower case
    (`Locale.ROOT`);
  - `display_name varchar(50) not null`;
  - `password_hash varchar(100) not null`;
  - `role varchar(16) not null check (role in ('USER','ADMIN'))`;
  - `created_at timestamptz not null`.
- `refresh_tokens`:
  - `id bigint` identity primary key;
  - `user_id` references `users` with `on delete cascade`;
  - `family_id uuid not null`;
  - `token_hash varchar(64) not null unique` (Hibernate schema validation maps `String` to `varchar`, not `char`);
  - `created_at`, `expires_at`, `rotated_at` (nullable) and `revoked_at`
    (nullable);
  - an index on `family_id`.
- Ids are numeric identities, which are simpler than UUIDs for a demo. The API
  exposes them as numbers.

### D3. Access tokens with Spring Security's resource server
- The JWT support comes from `spring-boot-starter-oauth2-resource-server`:
  `NimbusJwtEncoder` and `NimbusJwtDecoder.withSecretKey(...)` with HS256.
- Claims:
  - `sub`: the user id;
  - `roles`: `["USER"]` or `["ADMIN"]`;
  - `iat` and `exp`, taken from the injected `Clock`.
- A `JwtAuthenticationConverter` maps `roles` to `ROLE_*` authorities, so
  `hasRole("ADMIN")` and `@PreAuthorize` work.
- *Alternative:* a hand-written filter with jjwt. Rejected: it is more code for
  the same behaviour, and the resource server already validates the signature
  and the expiry.
- The decoder keeps Spring's default 60-second clock skew. The expired-token test
  therefore uses a token issued 20 minutes earlier, not 16, which is still the
  behaviour the spec scenario describes.
- A token that fails validation gets 401 on every path, including public GETs.
  That is Spring's bearer-filter behaviour, and the front-end relies on it to
  trigger a refresh.

### D4. Refresh tokens: random, hashed, rotated by family
- Token value: 32 bytes from `SecureRandom`, encoded as base64url.
- Stored as SHA-256 hex. A fast hash is enough because the value has 256 bits of
  entropy; bcrypt would only slow every refresh.
- **Refresh:**
  1. Look the hash up with `PESSIMISTIC_WRITE`.
  2. If the token is valid, set its `rotated_at` and insert a successor with the
     same `family_id` and a new 14-day expiry. The expiry slides with each use.
  3. If the token is already rotated or revoked, revoke every live token of its
     family and answer 401.
- **Login and register** start a new family.
- **Logout** sets `revoked_at` on the presented token only. Other devices stay
  signed in.

### D5. The refresh cookie
- `ResponseCookie.from("refresh_token", value)` with `httpOnly`, `secure`,
  `sameSite("Strict")`, `path("/api/v1/auth")` and `maxAge(14 days)`.
- Clearing the cookie uses the same attributes with `maxAge(0)`.
- `Secure` is always set. Chrome, Firefox and Edge accept `Secure` cookies on
  `http://localhost`, which is where the compose stack runs.
- **CSRF protection is disabled:**
  - Every state-changing call except refresh and logout needs a bearer header,
    which a cross-site request cannot add.
  - Refresh and logout rely on `SameSite=Strict` together with the
    `/api/v1/auth` path.

### D6. Access rules and errors
The filter chain is stateless (`SessionCreationPolicy.STATELESS`; no form login
and no HTTP basic), with the matchers below in order:

| Rule | Paths |
| --- | --- |
| permit | `GET /actuator/**` (only `health` is web-exposed, so the others stay 404 as `shared/health` requires) |
| permit | `/error`, `/v3/api-docs/**`, `/swagger-ui/**` |
| permit | `POST /api/v1/auth/{register,login,refresh,logout}` |
| `ADMIN` | `/api/v1/admin/**` |
| authenticated | `GET /api/v1/auth/me` |
| permit | `GET /api/v1/**` |
| authenticated | everything else |

- Problem details for security failures:
  - An `AuthenticationEntryPoint` writes a 401 `application/problem+json` with
    `instance` set. It delegates to `BearerTokenAuthenticationEntryPoint` first,
    so the `WWW-Authenticate` header stays.
  - An `AccessDeniedHandler` writes a 403 problem in the same way.
- Service errors are `ErrorResponseException` subclasses, which
  `GlobalExceptionHandler` already renders:
  - `InvalidCredentialsException` (401, one fixed detail);
  - `EmailTakenException` (409);
  - `InvalidRefreshTokenException` (401). The controller catches it to clear the
    cookie before rethrowing.
- A unique-constraint violation during registration, which means two concurrent
  sign-ups with one email, also becomes 409.
- **Timing:** a login with an unknown email still runs one bcrypt `matches`
  against a fixed dummy hash, so its response time does not reveal whether the
  email exists.

### D7. Validation details
- `RegisterRequest`:
  - `@NotBlank @Email @Size(max = 254) email`;
  - `@NotBlank @Size(max = 50) displayName`;
  - `@NotBlank @Size(min = 8) @MaxUtf8Bytes(72) password`.
- `@MaxUtf8Bytes` is a small constraint in `auth.web`. It exists because bcrypt
  ignores bytes after the 72nd, and Spring Security 7 rejects such passwords
  rather than truncating them.
- `LoginRequest` requires only a non-blank email and password, so a malformed
  login still gets the generic 401 and not a 400 that reveals the rules.

### D8. Configuration
`AuthProperties` (`divenet.auth`) is validated at startup:

| Property | Environment | Default |
| --- | --- | --- |
| `jwt-secret` | `JWT_SECRET` | `dev-only-jwt-secret-change-me-0123456789` in `application.yaml`, for `spring-boot:test-run` and tests |
| `admin.email` | `ADMIN_EMAIL` | empty |
| `admin.password` | `ADMIN_PASSWORD` | empty |
| `admin.display-name` | `ADMIN_DISPLAY_NAME` | `Admin` |

- A secret shorter than 32 bytes throws an `IllegalStateException` naming
  `JWT_SECRET`.
- The defaults follow the pattern the datasource settings already use: built-in
  values serve local runs, and compose makes the real values mandatory.
- `compose.yaml`:
  - passes `JWT_SECRET: ${JWT_SECRET:?…}`, so it is required;
  - passes `ADMIN_EMAIL` and `ADMIN_PASSWORD` as optional variables.
- `.env.example` gets a 40-character placeholder secret and
  `ADMIN_EMAIL=admin@divenet.test` with a placeholder password, so the smoke
  test still starts the stack.
- `check-compose.mjs` and `smoke-stack.mjs` add `JWT_SECRET` and `ADMIN_` to the
  pattern of host variables they remove.
- `AdminBootstrap` refuses to start when `ADMIN_PASSWORD` is set but shorter
  than 8 characters, so the admin cannot get a password that registration would
  refuse.

### D9. API shapes and OpenAPI

| Method and path | Request | Success | Errors |
| --- | --- | --- | --- |
| `POST /api/v1/auth/register` | `{email, displayName, password}` | 201 `AuthResponse` + cookie | 400, 409 |
| `POST /api/v1/auth/login` | `{email, password}` | 200 `AuthResponse` + cookie | 401 |
| `POST /api/v1/auth/refresh` | cookie | 200 `AuthResponse` + new cookie | 401 (clears cookie) |
| `POST /api/v1/auth/logout` | cookie (optional) | 204, clears cookie | — |
| `GET /api/v1/auth/me` | bearer | 200 `UserResponse` | 401 |

- `AuthResponse` is `{accessToken, tokenType: "Bearer", expiresIn: 900, user}`.
- `UserResponse` is `{id, email, displayName, role}`.
- `OpenApiConfig` declares a `bearerAuth` HTTP bearer scheme, and `/me` carries
  `@SecurityRequirement(name = "bearerAuth")`.

### D10. Front-end session lives next to the API client
- `src/api/session.ts` holds the session state in memory: `loading`, then
  `signedOut` or `signedIn` (`{user, accessToken}`). It has a `subscribe`
  function for `useSyncExternalStore`, and functions to sign in, to sign out and
  to refresh. The refresh function shares one in-flight promise.
- `client.ts` passes `createClient` a `fetch` wrapper that adds
  `Authorization: Bearer`. On a 401 from any path other than the four open auth
  endpoints, it refreshes once and retries a clone of the original request. A
  failed refresh sets `signedOut`.
- *Alternative:* a React context that owns the token. Rejected because the
  client is a module singleton used outside React, for example by query
  functions, so the token must be reachable without hooks.
- Shared state is kept to the session only, which ARCHITECTURE.md allows with a
  justification.
- `src/features/auth/`:
  - the `useSession()` hook;
  - `LoginPage` and `RegisterPage` with their Zod schemas;
  - the `AccountArea` component and the redirect guard;
  - a `routes.tsx` that `router.tsx` spreads into the layout's children.
- `restoreSession()` runs from an effect in `AppLayout`, not `App.tsx`: the route
  tests render `routes` without `App`, and must restore the session the same way
  (implementation note). It does nothing once the session has left `loading`, and is
  safe under StrictMode, because it shares the in-flight promise.
- **Component boundaries:**
  - `AppHeader` and `NavDrawer` take an `account` render prop
    (`(placement: "header" | "drawer", onNavigate) => ReactNode`).
  - `AppLayout` (`src/app`) supplies `AccountArea`, so `src/components` never
    imports a feature.
- **Redirect:** the header's "Log in" link passes `state.from` (the current
  location). After a login, the app navigates to that location, or to `/`, with
  `replace`.
- **Forms:**
  - React Hook Form with `zodResolver`.
  - Each Zod message is an i18n key, translated at render time.
  - Server `errors` are mapped with `setError` to a translated per-field message
    (`auth.errors.<field>`). The back-end's English text is never shown.
  - A 409 maps to `auth.errors.emailTaken` on the email field.
- **Shared components:** `TextField`, `Button` and `Alert` are built now in
  `src/components/`, from their `design/system/components/` specs and
  `bundle.css`, because these pages are the first to need them.
- **Avatar:** the initials are the first letter of the first two words of the
  display name, upper-cased in the user's locale. The account button opens a
  `role="menu"` list with the name as a heading and a "Log out" `menuitem`.
- **Tests:**
  - `src/test/server.ts` gets a default handler where `POST /auth/refresh`
    answers 401. Existing route tests stay signed out without changes.
  - Signed-in tests override that handler with `server.use(...)`.

### D11. i18n keys
- New namespaces:
  - `auth.login.*`, `auth.register.*` and `auth.errors.*`;
  - `shell.account.*`: log in, sign up, the account button's name, log out.
- Every key goes into both `en.json` and `uk.json`.

## Risks / Trade-offs

- **Two tabs refreshing at once:** the second tab presents a token the first
  just rotated, so the server sees a replay and revokes the family. Both tabs are
  then signed out.
  → Mitigation: in-tab refreshes are de-duplicated. Within one tab, the access
  token only needs a refresh every 15 minutes. A grace window or cross-tab locks
  can come later if the demo shows the problem.
- **`refresh_tokens` grows without cleanup.**
  → Each row is small, and a demo creates few. A scheduled purge of expired
  rows can join the media cleanup job in `add-media-uploads`.
- **No rate limiting on login:** brute force is possible.
  → Accepted for a course project and listed as deferred in the proposal. bcrypt
  makes each guess slow.
- **Safari and `Secure` cookies on `http://localhost`:** older Safari versions
  drop the cookie, so the session is not restored after a reload there.
  → The demo uses Chrome or Firefox. Over HTTPS, nothing changes.
- **Existing tests:**
  - `ApiErrorsIT`'s POST and DELETE calls now need authentication. They get
    `with(jwt())` from `spring-security-test` and still check the same
    responses.
  - The route tests get the default refresh handler.
  - Neither change weakens a check.

## Migration Plan

- The change adds new tables only. Rolling back means reverting the PR and
  dropping the two tables on a local database. There is no production data.
- After the merge, an existing local `.env` needs `JWT_SECRET`. Compose names it
  when it is missing, and the README's copy step (`cp .env.example .env`) adds it.
