# Spec Delta

## MODIFIED Requirements

### Requirement: Configuration comes from the env file
The stack SHALL take from environment variables the database name, user and
password, the web port, the JWT signing key (`JWT_SECRET`) and the optional
first-admin credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). `.env.example` SHALL
be the only committed env file, and it SHALL hold placeholder values only. The
stack SHALL refuse to start when the database password or the JWT signing key is
not set, rather than use a built-in value.

#### Scenario: Missing password is rejected
- **WHEN** the compose configuration is rendered with an env file that omits the database password
- **THEN** `docker compose config` exits non-zero and its error names the missing variable

#### Scenario: Missing JWT key is rejected
- **WHEN** the compose configuration is rendered with an env file that omits `JWT_SECRET`
- **THEN** `docker compose config` exits non-zero and its error names `JWT_SECRET`

#### Scenario: Auth settings reach the back-end
- **WHEN** the compose configuration is rendered with `.env.example`
- **THEN** the `backend` service's environment has `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`

#### Scenario: Web port is configurable
- **WHEN** the compose configuration is rendered with `WEB_PORT=9090`
- **THEN** the `web` service publishes host port 9090
