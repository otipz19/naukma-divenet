# Proposal

## Why

Every feature after M0 that writes data needs a signed-in user: reviews,
warnings, site submissions, the dive log, posts. Moderation also needs an admin.
Today the API has no users and no security, and the header has no account area.
ADR-0004 already fixed the scheme: email and password, short-lived JWT access
tokens, and a rotating refresh cookie. This change builds it so the M1–M5
features can rely on `USER` and `ADMIN`.

Roadmap item: `add-authentication` (M0). It covers no user story of its own;
PRODUCT.md lists accounts ("register, log in") and the roles `USER` and `ADMIN`
in scope, and every authoring story (US-03, 04, 07, 08, 09, 12, S1, C1) depends on it.

## What Changes

- **Accounts:**
  - A `users` table holds email (unique, case-insensitive), display name,
    bcrypt password hash, role (`USER` or `ADMIN`) and creation time.
  - A `refresh_tokens` table holds hashed refresh tokens, with an expiry and a
    revocation time.
- **Auth API** under `/api/v1/auth`:
  - `POST /register` creates a `USER` and signs them in.
  - `POST /login` signs in, or returns 401 with one message that does not say
    whether the email exists.
  - `POST /refresh` rotates the refresh cookie and returns a new access token.
    Reusing an already-rotated token revokes that token's whole family.
  - `POST /logout` revokes the refresh token and clears the cookie.
  - `GET /me` returns the signed-in user.
  - Access tokens are HMAC-signed JWTs that last 15 minutes and are sent as
    `Authorization: Bearer`. Refresh tokens last 14 days and travel in an
    `HttpOnly; SameSite=Strict` cookie scoped to `/api/v1/auth`.
- **Security rules for every endpoint:**
  - Public GETs and the auth endpoints are anonymous.
  - Any other request needs a valid access token.
  - `/api/v1/admin/**` needs `ADMIN`.
  - Failures are RFC 9457 problems: 401 when no valid token was sent, 403 when
    the role is wrong.
  - `/actuator/health` stays anonymous.
- **Admin bootstrap:** at startup, when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are
  set and no account with that email exists, the app creates it as an `ADMIN`.
- **Configuration:**
  - `JWT_SECRET` (at least 32 bytes) is required; the app refuses to start
    without it.
  - `compose.yaml` and `.env.example` gain `JWT_SECRET`, `ADMIN_EMAIL` and
    `ADMIN_PASSWORD`, with placeholder values only.
  - The compose check refuses a configuration without `JWT_SECRET`, as it
    already does for the database password.
- **Web app** (following `design/screens/Auth.html`):
  - A login page `/login`, with the failed-login banner.
  - A sign-up page `/register`, with server field errors under their fields.
  - Session state in memory: the access token is never stored. On load, the app
    restores the session from the refresh cookie. An API call that gets a 401
    refreshes once and retries.
  - The header's account area:
    - signed out: a "Log in" link and a "Sign up" button;
    - signed in: an initials avatar opening a menu with the display name and "Log out".
  - The drawer holds the same account links.
  - All text is in `en` and `uk`.

Deferred:

- **Profile, My posts and Settings in the avatar menu:** each is added by the
  change that builds its page (`add-diver-profile`, `add-posts`).
- **The admin "Moderation" header link:** added by
  `add-site-submission-and-moderation`, the first admin page.
- **Rate limiting and account lockout:** not in ADR-0004 and not needed for a
  course demo; recorded as a known gap.
- **Password change, account deletion, email confirmation, password reset and
  OAuth:** out of scope (PRODUCT.md) or not on the roadmap.

## Capabilities

### New Capabilities

- `auth`: user accounts and their roles, and how users sign in and out:
  - registration and login;
  - access tokens and refresh-token rotation;
  - logout and the current-user endpoint;
  - endpoint access rules (anonymous, signed in, admin);
  - admin bootstrap from the environment;
  - the login and sign-up pages and session handling in the web app.

### Modified Capabilities

- `shared/app-shell`:
  - The header gains the account area (signed out or signed in).
  - The navigation drawer also holds the account links.
- `shared/local-stack`: "Configuration comes from the env file" now also covers
  the JWT key and the admin bootstrap variables. The stack refuses to start
  without `JWT_SECRET`.

## Impact

- **Back-end:**
  - New feature packages `auth` (web, service, domain: refresh tokens) and
    `user` (domain only: the `User` entity and repository, which later features
    reference).
  - Spring Security configuration in `shared`.
  - Flyway `V2__create_users_and_refresh_tokens.sql`.
  - New dependencies in `backend/pom.xml`: `spring-boot-starter-security`,
    `spring-boot-starter-oauth2-resource-server` and `spring-security-test`.
- **API contract:** five new endpoints and the bearer security scheme, so
  `api/openapi.json` and `frontend/src/api/schema.gen.ts` are regenerated.
- **Front-end:**
  - New `src/features/auth/`.
  - The API client gains the bearer-token and refresh-on-401 logic.
  - The header and drawer change, and the router gets two routes.
  - New dependencies: `react-hook-form`, `zod` and `@hookform/resolvers`, as
    ARCHITECTURE.md prescribes for forms. They change `frontend/package.json`
    and `pnpm-lock.yaml`, which are AGENTS.md boundaries. **Approving this
    proposal is asked to cover exactly these dependency additions.**
- **Stack:**
  - `compose.yaml` and `.env.example` gain three variables.
  - `scripts/check-compose.mjs` gains the missing-`JWT_SECRET` check.
  - Both compose scripts add the new variables to the pattern of host variables
    they remove.
- **Docs:**
  - ARCHITECTURE.md: the ER diagram notes the `users` and `refresh_tokens`
    columns this change creates.
  - AGENTS.md "Checks" mentions the JWT check.
- **No departure from `docs/ARCHITECTURE.md` or ADR-0004**, so no new ADR.
