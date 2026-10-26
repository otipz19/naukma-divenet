# Spec Delta

## Purpose

Lets people create a DiveNet account, sign in and out, and stay signed in
across page loads, and decides which endpoints need a signed-in user or an
administrator.

## ADDED Requirements

### Requirement: A visitor can register an account
`POST /api/v1/auth/register` SHALL take an email, a display name and a password.
It SHALL create a user with role `USER` and sign them in, exactly as a
successful login does. Emails SHALL be compared case-insensitively and stored
in lower case. Leading and trailing spaces SHALL be trimmed from the email and
the display name.

#### Scenario: Successful registration
- **WHEN** a visitor posts `{"email": "Mira@Example.com", "displayName": "Mira Koval", "password": "correct-horse"}`
- **THEN** the response is 201 with an access token and the user `{email: "mira@example.com", displayName: "Mira Koval", role: "USER"}`
- **AND** the response sets the refresh cookie

#### Scenario: Email already taken
- **WHEN** a visitor registers with `MIRA@example.com` after `mira@example.com` has registered
- **THEN** the response is a 409 problem
- **AND** no second user exists

### Requirement: Registration input is validated
Registration SHALL reject a request whose email is not a valid address or is longer
than 254 characters; whose display name is blank or longer than 50 characters;
or whose password is shorter than 8 characters or longer than 72 bytes in UTF-8.
It SHALL answer with a 400 problem that lists each invalid field.

#### Scenario: Short password
- **WHEN** a visitor registers with the password `short`
- **THEN** the response is a 400 problem whose `errors` contain the field `password`

#### Scenario: Several invalid fields
- **WHEN** a visitor registers with the email `not-an-email` and a blank display name
- **THEN** the 400 problem's `errors` contain the fields `email` and `displayName`

#### Scenario: Password too long for the hash
- **WHEN** a visitor registers with a password of 40 Cyrillic letters (80 bytes)
- **THEN** the response is a 400 problem whose `errors` contain the field `password`

### Requirement: Passwords are stored only as hashes
The system SHALL store a password only as a salted bcrypt hash. No response
SHALL contain the password or its hash.

#### Scenario: Stored hash
- **WHEN** a user registers with the password `correct-horse`
- **THEN** the stored password value starts with `{bcrypt}` and does not contain `correct-horse`

### Requirement: A user can log in
`POST /api/v1/auth/login` with a correct email (any letter case) and password
SHALL return 200 with an access token and the user, and set the refresh cookie.
A wrong password or an unknown email SHALL both return the same 401 problem, so
the response does not tell whether the email is registered.

#### Scenario: Successful login
- **WHEN** a registered user posts their email in upper case and their password
- **THEN** the response is 200 with an access token and their user

#### Scenario: Wrong password and unknown email look the same
- **WHEN** one login uses a registered email with a wrong password and another uses an unregistered email
- **THEN** both responses are 401 problems with the same title and detail
- **AND** neither sets the refresh cookie

### Requirement: Access tokens are short-lived bearer tokens
The access token SHALL be a signed JWT whose subject is the user's id, carrying the
user's role and expiring 15 minutes after issue. Requests SHALL send it as
`Authorization: Bearer <token>`. A request carrying an expired, wrongly signed
or malformed token SHALL get a 401 problem on any path.

#### Scenario: Token lifetime
- **WHEN** a user logs in
- **THEN** the response's `expiresIn` is 900
- **AND** the token's expiry is 15 minutes after its issue time

#### Scenario: Expired token
- **WHEN** a request to `GET /api/v1/auth/me` carries a token issued 20 minutes ago
- **THEN** the response is a 401 problem

#### Scenario: Tampered token
- **WHEN** a request to an anonymous `GET /api/v1/...` path carries a token whose payload was changed after signing
- **THEN** the response is a 401 problem

### Requirement: The refresh token travels in a restricted cookie
Login, registration and refresh SHALL set the refresh token in a cookie
named `refresh_token`, with the attributes `HttpOnly`, `Secure`,
`SameSite=Strict` and `Path=/api/v1/auth`, and a `Max-Age` of 14 days. The
refresh token SHALL be random, and the system SHALL store only its hash.

#### Scenario: Cookie attributes
- **WHEN** a user logs in
- **THEN** the `Set-Cookie` header for `refresh_token` has `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api/v1/auth` and `Max-Age=1209600`
- **AND** the response body does not contain the refresh token

#### Scenario: Only the hash is stored
- **WHEN** a user logs in
- **THEN** the stored refresh-token record does not contain the cookie's value

### Requirement: Refreshing rotates the refresh token
`POST /api/v1/auth/refresh` with a valid refresh cookie SHALL return a new access
token and the user, set a new refresh cookie, and invalidate the presented
refresh token. A missing, unknown, expired or revoked refresh token SHALL get a
401 problem, and the response SHALL clear the cookie.

#### Scenario: Successful refresh
- **WHEN** a client posts to the refresh endpoint with the cookie from its login
- **THEN** the response is 200 with a new access token
- **AND** the response sets a `refresh_token` cookie with a different value

#### Scenario: No cookie
- **WHEN** a client posts to the refresh endpoint without a cookie
- **THEN** the response is a 401 problem

#### Scenario: Expired refresh token
- **WHEN** a client refreshes with a token issued more than 14 days ago
- **THEN** the response is a 401 problem that clears the `refresh_token` cookie

### Requirement: Reusing a rotated refresh token revokes its family
All refresh tokens descended from one login or registration SHALL form a
family. When a refresh token that was already rotated is presented again, the
system SHALL answer 401 and revoke every token of its family. The user must
then log in again on every device that held a token of that family.

#### Scenario: Replay after rotation
- **WHEN** a client refreshes with token A, receives token B, then presents token A again
- **THEN** that request gets a 401 problem
- **AND** a later refresh with token B also gets a 401 problem

#### Scenario: Other sessions are unaffected
- **WHEN** a user is logged in on two devices and one device's family is revoked by a replay
- **THEN** the other device's refresh token still refreshes

### Requirement: A user can log out
`POST /api/v1/auth/logout` SHALL revoke the presented refresh token. It SHALL
clear the `refresh_token` cookie and answer 204, even when no cookie or an
unknown cookie was sent.

#### Scenario: Logout revokes the token
- **WHEN** a logged-in client logs out and then refreshes with the same cookie
- **THEN** the logout response is 204 and clears the cookie
- **AND** the refresh gets a 401 problem

#### Scenario: Logout without a session
- **WHEN** a client without a cookie logs out
- **THEN** the response is 204

### Requirement: The current user can be read
`GET /api/v1/auth/me` with a valid access token SHALL return the user's id,
email, display name and role. Without a valid token it SHALL return a 401
problem.

#### Scenario: Signed in
- **WHEN** a user requests `/api/v1/auth/me` with their access token
- **THEN** the response is 200 with their id, email, display name and role

#### Scenario: Anonymous
- **WHEN** a request to `/api/v1/auth/me` has no `Authorization` header
- **THEN** the response is a 401 problem

### Requirement: Endpoints are protected by default
Under `/api/v1`, GET requests and the register, login, refresh and logout
endpoints SHALL be open to anonymous users. Every other request SHALL need a
valid access token. Requests under `/api/v1/admin/` SHALL need role `ADMIN`.
`/actuator/health` SHALL stay anonymous.

#### Scenario: Anonymous write is refused
- **WHEN** an anonymous client sends a POST to an endpoint under `/api/v1` other than the open auth endpoints
- **THEN** the response is a 401 problem with content type `application/problem+json`

#### Scenario: User on an admin endpoint
- **WHEN** a user with role `USER` requests an endpoint under `/api/v1/admin/`
- **THEN** the response is a 403 problem

#### Scenario: Admin on an admin endpoint
- **WHEN** a user with role `ADMIN` requests the same endpoint
- **THEN** the request reaches the endpoint

#### Scenario: Public reads stay anonymous
- **WHEN** an anonymous client requests `GET /actuator/health` or an unknown `GET /api/v1/...` path
- **THEN** the responses are 200 and 404, not 401

### Requirement: The first admin comes from the environment
At startup, when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are both set and no user has
that email, the system SHALL create a user with that email, the display name
`ADMIN_DISPLAY_NAME` (default "Admin") and role `ADMIN`. An existing user with
that email SHALL be left unchanged. When either variable is unset, no admin
SHALL be created.

#### Scenario: Admin is created once
- **WHEN** the application starts twice with `ADMIN_EMAIL=admin@divenet.test` and an admin password
- **THEN** exactly one user with that email exists, with role `ADMIN`
- **AND** that user can log in with the configured password

#### Scenario: No admin variables
- **WHEN** the application starts without `ADMIN_EMAIL`
- **THEN** no user exists

### Requirement: The signing key comes from the environment
The system SHALL sign access tokens with the key in `JWT_SECRET`. It SHALL
refuse to start when that key is shorter than 32 bytes. Outside the compose
stack, local development runs and tests MAY fall back to a built-in key for
development only.

#### Scenario: Short key is refused
- **WHEN** the application starts with `JWT_SECRET=too-short`
- **THEN** startup fails with a message that names `JWT_SECRET`

### Requirement: The web app has a login page
`/login` SHALL show a form with labelled email and password fields and a
"Log in" button, and a link to `/register`. A successful login SHALL sign the
user in and go to the page they came from, or `/` when they came from nowhere.
A 401 SHALL show a translated danger banner with `role="alert"` and keep the
entered email.

#### Scenario: Successful login
- **WHEN** the user submits valid credentials on `/login` and the API answers 200
- **THEN** the app shows the page at `/`
- **AND** the header shows the signed-in account area

#### Scenario: Failed login
- **WHEN** the API answers the login with 401
- **THEN** an alert shows "Email or password is incorrect." in the active locale
- **AND** the email field keeps its value

#### Scenario: Missing fields
- **WHEN** the user submits the form with an empty email
- **THEN** no request is sent
- **AND** the email field is marked invalid with a translated message linked by `aria-describedby`

### Requirement: The web app has a sign-up page
`/register` SHALL show labelled display name, email and password fields, a
hint under the display name, a "Create account" button and a link to
`/login`. It SHALL check the password length before sending. Field errors from
a 400 problem SHALL appear under the matching field, and a 409 SHALL appear under
the email field. A successful sign-up SHALL sign the user in and go to `/`.

#### Scenario: Password too short
- **WHEN** the user enters a 5-character password and submits
- **THEN** no request is sent
- **AND** the password field shows "Must be at least 8 characters." in the active locale

#### Scenario: Server field error
- **WHEN** the API answers the registration with a 400 problem whose `errors` contain the field `email`
- **THEN** the email field is marked invalid and shows a translated message

#### Scenario: Email taken
- **WHEN** the API answers the registration with 409
- **THEN** the email field shows a translated "already registered" message

#### Scenario: Successful sign-up
- **WHEN** the API answers the registration with 201
- **THEN** the app shows the page at `/` with the signed-in account area

### Requirement: Signed-in users skip the login and sign-up pages
When a signed-in user opens `/login` or `/register`, the app SHALL show the page
at `/` instead.

#### Scenario: Login page while signed in
- **WHEN** a signed-in user opens `/login`
- **THEN** the app shows the page at `/`

### Requirement: The web app keeps the session without storing the access token
The web app SHALL keep the access token only in memory, never in browser
storage or a readable cookie. On load it SHALL call the refresh endpoint once to
restore the session. An API call answered with 401 SHALL trigger one refresh
followed by one retry of the call. When the refresh fails, the user SHALL become
signed out.

#### Scenario: Session restored on load
- **WHEN** the app loads and the refresh endpoint answers 200
- **THEN** the header shows the signed-in account area without a login

#### Scenario: No session on load
- **WHEN** the app loads and the refresh endpoint answers 401
- **THEN** the header shows "Log in" and "Sign up"

#### Scenario: Expired access token is renewed
- **WHEN** a signed-in API call gets 401, the refresh succeeds and the retried call gets 200
- **THEN** the caller receives the 200 response
- **AND** the retry carries the new access token

#### Scenario: Token never stored
- **WHEN** a user has logged in
- **THEN** neither `localStorage` nor `sessionStorage` contains the access token

### Requirement: The web app logs the user out
Choosing "Log out" SHALL call the logout endpoint, forget the access token and
show the signed-out account area. The app SHALL do this even when the logout
call fails.

#### Scenario: Log out
- **WHEN** a signed-in user opens the account menu and chooses "Log out"
- **THEN** the logout endpoint is called
- **AND** the header shows "Log in" and "Sign up"
