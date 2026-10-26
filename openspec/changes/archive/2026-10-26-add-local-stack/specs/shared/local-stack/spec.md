# Spec Delta

## Purpose

Runs the whole product locally the way it is demonstrated: the database, the
back-end and the web server start with one command from a committed env template,
and the gate and CI verify that this runtime keeps working.

## ADDED Requirements

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
Requests under `/api/` on the web port SHALL be forwarded to the back-end, and
the back-end's response SHALL reach the client unchanged, including its status
code and content type.

#### Scenario: API error comes from the back-end
- **WHEN** a client sends `GET /api/v1/does-not-exist` to the web port
- **THEN** the response status is 404 with the content type `application/problem+json`
- **AND** the body's `instance` is `/api/v1/does-not-exist`

### Requirement: Configuration comes from the env file
The stack SHALL take the database name, user and password and the web port from
environment variables. `.env.example` SHALL be the only committed env file, and
the stack SHALL refuse to start when the database password is not set rather
than use a built-in value.

#### Scenario: Missing password is rejected
- **WHEN** the compose configuration is rendered with an env file that omits the database password
- **THEN** `docker compose config` exits non-zero and its error names the missing variable

#### Scenario: Web port is configurable
- **WHEN** the compose configuration is rendered with `WEB_PORT=9090`
- **THEN** the `web` service publishes host port 9090

### Requirement: Only the web port is exposed
The web server SHALL be the only service that publishes a port to the host. The
database and the back-end SHALL be reachable only from inside the stack.

#### Scenario: Published ports
- **WHEN** the compose configuration is rendered with `.env.example`
- **THEN** `web` publishes exactly one port
- **AND** `db` and `backend` publish none

### Requirement: Database data survives a restart
The database SHALL keep its data in a named volume, so stopping and starting the
stack without removing volumes keeps the migrated schema and its history.

#### Scenario: Restart keeps the migration history
- **WHEN** the stack is stopped with `docker compose down` (no `-v`) and started again
- **THEN** the migration history has the same rows, with the same install times, as before the restart

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
