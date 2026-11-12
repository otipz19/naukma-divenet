# shared/e2e Specification

## Purpose

End-to-end browser journeys that run the real compose stack the way it is
demonstrated, verifying the whole chain — web server, API, database, object
storage and the single-page app — works together, and that CI keeps it working.

## Requirements

### Requirement: Journeys run against the real stack

The E2E suite SHALL run its journeys in a real browser against the compose
stack started from the committed configuration, with the demo profile active,
and SHALL NOT mock the API, the web server, the database or object storage.
Each journey SHALL leave the stack in a state other journeys can use, and the
runner SHALL tear the stack down when the run ends.

#### Scenario: Anonymous visitor browses a site

- **WHEN** the suite opens the map page on the stack's web port as an anonymous visitor
- **THEN** seeded site markers and the result list are visible, and opening a seeded site shows its details, including its reviews

#### Scenario: A new user registers, logs in and reviews a site

- **WHEN** the suite registers a new user through the register page, logs in, and submits a review with a photo on a seeded site
- **THEN** the review with its photo appears in that site's reviews, and the site's average rating reflects it

#### Scenario: A demo diver logs a dive and earns an achievement

- **WHEN** the suite logs in as a seeded demo diver and adds a dive-log entry for a seeded site
- **THEN** the entry appears in the diver's dive log, and an achievement unlocked for that action is shown

#### Scenario: A published post reaches the global feed

- **WHEN** the suite logs in, writes and publishes a post linked to a region
- **THEN** the post appears in the global feed

#### Scenario: An admin approves a submitted site

- **WHEN** the suite logs in as the admin from the stack's environment, opens the moderation queue, and approves a submitted site
- **THEN** the site becomes publicly visible on the map and openable by an anonymous visitor

### Requirement: A login session survives token refresh

The suite SHALL verify, in a real browser with the stack's own cookies, that a
logged-in user keeps working across an access-token expiry: after the access
token expires, the next request SHALL silently refresh the session and the user
SHALL remain logged in, without seeing the login page.

#### Scenario: Session survives an expired access token

- **WHEN** the suite logs in, the access token's validity window passes, and the user then opens an authenticated page
- **THEN** the page loads for the still-logged-in user, and the login page is not shown

### Requirement: One command runs the suite

The repository SHALL provide a single command that builds and starts an
isolated compose stack, runs the whole E2E suite against it, reports failures
with the browser's traces, and always tears the stack down afterwards. The
stack the command starts SHALL NOT collide with a developer's own running
stack (separate compose project and web port).

#### Scenario: The command runs green on a fresh machine state

- **WHEN** the command is run with Docker available and no stack running
- **THEN** every journey passes, and afterwards no containers, networks or volumes of the run remain

#### Scenario: A failing journey is reported and cleaned up

- **WHEN** a journey fails during the run
- **THEN** the command exits non-zero, reports the failing journey, and still tears the stack down

### Requirement: CI runs the E2E suite

CI SHALL run the E2E suite on every push to `master` and on every pull request,
in a job separate from the quality gate, and the job SHALL fail when any
journey fails.

#### Scenario: CI job runs the suite on a pull request

- **WHEN** a pull request is opened or updated
- **THEN** CI runs the E2E job, and the pull request cannot merge while the job is failing
