# shared/local-stack Specification

## Purpose

Runs the whole product locally the way it is demonstrated: the database, the
back-end and the web server start with one command from a committed env template,
and the gate and CI verify that this runtime keeps working.

## Requirements

### Requirement: One command starts the stack
Starting the compose stack with an env file copied from `.env.example` SHALL
bring up the database, the back-end and the web server, each reporting healthy.
The back-end SHALL start only after the database is healthy, and the web server
only after the back-end is healthy.

#### Scenario: Stack becomes healthy
- **WHEN** the stack is started with `docker compose --env-file .env.example up --build --wait`
- **THEN** the command exits 0
- **AND** the `db`, `backend` and `web` services all report the health status `healthy`

#### Scenario: Start order follows health
- **WHEN** the compose configuration is rendered with `.env.example`
- **THEN** `backend` depends on `db` with the condition `service_healthy`
- **AND** `web` depends on `backend` with the condition `service_healthy`

### Requirement: The web server serves the single-page app
The web server SHALL serve the front-end production build at `/`. A request for
a path that is not a file of the build and not under `/api/` or `/media/` SHALL
receive the app's `index.html`, so client-side routes load directly.

#### Scenario: Home page
- **WHEN** a client sends `GET /` to the web port of the running stack
- **THEN** the response status is 200 with an HTML content type
- **AND** the body contains the app's root element `<div id="root">`

#### Scenario: Client-side route
- **WHEN** a client sends `GET /no-such-page` to the web port
- **THEN** the response status is 200 and the body is the same `index.html`

#### Scenario: Built asset
- **WHEN** a client requests a script referenced by `index.html` from the web port
- **THEN** the response status is 200 with a JavaScript content type

### Requirement: The web server proxies the API
Requests under `/api/` and `/media/` on the web port SHALL be forwarded to the back-end, and
the back-end's response SHALL reach the client unchanged, including its status
code and content type. The web server SHALL accept request bodies large enough for a 10 MB
upload with its multipart framing.

#### Scenario: API error comes from the back-end
- **WHEN** a client sends `GET /api/v1/does-not-exist` to the web port
- **THEN** the response status is 404 with the content type `application/problem+json`
- **AND** the body's `instance` is `/api/v1/does-not-exist`

#### Scenario: Media error comes from the back-end
- **WHEN** a client sends `GET /media/00000000-0000-0000-0000-000000000000` to the web port
- **THEN** the response status is 404 with the content type `application/problem+json`

#### Scenario: Upload at the size limit passes the web server
- **WHEN** a signed-in client posts a valid 10 MB image to `POST /api/v1/media` on the web port
- **THEN** the response status is 201

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

### Requirement: Database data survives a restart
The database SHALL keep its data in a named volume, so stopping and starting the
stack without removing volumes keeps the migrated schema and its history.

#### Scenario: Restart keeps the migration history
- **WHEN** the stack is stopped with `docker compose down` (no `-v`) and started again
- **THEN** the migration history has the same rows, with the same install times, as before the restart

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

### Requirement: Image versions are pinned
Every service SHALL use base images with an explicit version tag, never `latest`
or an untagged image, so two runs of the stack build the same thing.

#### Scenario: Unpinned image is rejected
- **WHEN** the gate's compose check runs on a configuration in which a service image or a Dockerfile `FROM` line has no tag or the tag `latest`
- **THEN** the check fails and names that service or Dockerfile

### Requirement: The gate and CI verify the stack
The quality gate SHALL validate the compose configuration without building
images, and fail on any violation of the requirements above that the rendered
configuration shows. CI SHALL also run a smoke test that starts the real stack
and checks the scenarios above that need it running.

#### Scenario: Gate rejects a broken configuration
- **WHEN** the gate runs and a service in `compose.yaml` has no health check
- **THEN** the compose step fails and names that service

#### Scenario: Smoke test cleans up
- **WHEN** the smoke test finishes, whether its checks passed or failed
- **THEN** its compose project's containers, network and volumes are removed
- **AND** its exit code is non-zero if any check failed

#### Scenario: Transient image pull failure is retried
- **WHEN** pulling one of the stack's images fails and a later attempt, within the retry limit of 3 attempts, succeeds
- **THEN** the smoke test goes on to start the stack and run its checks
- **AND** its exit code is 0 if every check passes

#### Scenario: Image pull keeps failing
- **WHEN** every attempt to pull one of the stack's images fails
- **THEN** the smoke test does not start the stack and exits non-zero
- **AND** its output names that image
- **AND** its compose project's containers, network and volumes are removed

### Requirement: The stack starts with demo data by default
The compose stack SHALL pass `SPRING_PROFILES_ACTIVE` to the back-end, defaulting to
`demo`, so a fresh stack shows seeded sites. Setting the variable in the env file SHALL
override the default.

#### Scenario: Variable not set
- **WHEN** the compose configuration is rendered without `SPRING_PROFILES_ACTIVE`
- **THEN** the back-end's `SPRING_PROFILES_ACTIVE` is `demo`

#### Scenario: Variable set
- **WHEN** the compose configuration is rendered with `SPRING_PROFILES_ACTIVE=prod`
- **THEN** the back-end's `SPRING_PROFILES_ACTIVE` is `prod`
