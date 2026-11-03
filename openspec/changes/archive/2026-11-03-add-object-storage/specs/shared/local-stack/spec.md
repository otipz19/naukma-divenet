# shared/local-stack

## MODIFIED Requirements

### Requirement: Configuration comes from the env file
The stack SHALL take its settings from environment variables: the database
name, user and password, the web port, `JWT_SECRET`, the optional first admin
(`ADMIN_EMAIL`, `ADMIN_PASSWORD`) and the MinIO credentials
(`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`). `.env.example`, with placeholder
values only, SHALL be the only committed env file. The stack SHALL refuse to
start without the database password, `JWT_SECRET` or the MinIO password.

#### Scenario: Missing password is rejected
- **WHEN** the compose configuration is rendered with an env file that omits the database password
- **THEN** `docker compose config` exits non-zero and its error names the missing variable

#### Scenario: Missing JWT key is rejected
- **WHEN** the compose configuration is rendered with an env file that omits `JWT_SECRET`
- **THEN** `docker compose config` exits non-zero and its error names `JWT_SECRET`

#### Scenario: Missing MinIO password is rejected
- **WHEN** the compose configuration is rendered with an env file that omits `MINIO_ROOT_PASSWORD`
- **THEN** `docker compose config` exits non-zero and its error names `MINIO_ROOT_PASSWORD`

#### Scenario: Auth settings reach the back-end
- **WHEN** the compose configuration is rendered with `.env.example`
- **THEN** the `backend` service's environment has `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`

#### Scenario: Web port is configurable
- **WHEN** the compose configuration is rendered with `WEB_PORT=9090`
- **THEN** the `web` service publishes host port 9090

### Requirement: Only the web port is exposed
The web server SHALL be the only service that publishes a port to the host. The
database, the back-end and MinIO SHALL be reachable only from inside the stack.

#### Scenario: Published ports
- **WHEN** the compose configuration is rendered with `.env.example`
- **THEN** `web` publishes exactly one port
- **AND** `db`, `backend` and `minio` publish none

### Requirement: Uploaded media survives a restart
The stack SHALL keep uploaded media in MinIO, whose data is on a named volume,
so stopping and starting the stack without removing volumes keeps every upload
and its thumbnail. The back-end SHALL use MinIO storage, and SHALL start only
once MinIO is healthy.

#### Scenario: Media directory is on a named volume
- **WHEN** the compose configuration is rendered with `.env.example`
- **THEN** the `minio` service's data directory is mounted from a named volume
- **AND** the back-end's media storage is `minio`, and it depends on `minio` being healthy

#### Scenario: Restart keeps an upload
- **WHEN** an image is uploaded, and the stack is stopped with `docker compose down` (no `-v`) and started again
- **THEN** `GET /media/{id}` and `GET /media/{id}/thumb` on the web port return 200 for that upload
