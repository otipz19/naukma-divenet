# shared/health Specification

## Purpose
Gives operators and container orchestration one anonymous endpoint that says
whether the back-end is up and can reach its database, without exposing
anything else about the runtime.

## Requirements

### Requirement: Health endpoint reports status
`GET /actuator/health` SHALL be reachable without authentication. It SHALL return
200 with `{"status":"UP"}` when the application and its database are healthy, and
503 with `status` `DOWN` when the database is unreachable. It SHALL NOT show
component details to anonymous callers.

#### Scenario: Healthy application
- **WHEN** a client sends `GET /actuator/health` while the database is reachable
- **THEN** the response status is 200 and the body's `status` is `UP`
- **AND** the body has no `components` or `details` field

#### Scenario: Database unreachable
- **WHEN** the database becomes unreachable and a client sends `GET /actuator/health`
- **THEN** the response status is 503 and the body's `status` is `DOWN`

### Requirement: Only the health endpoint is exposed
No Actuator endpoint other than `health` SHALL be reachable over HTTP.

#### Scenario: Other actuator endpoints are hidden
- **WHEN** a client sends `GET /actuator/env` or `GET /actuator/beans`
- **THEN** the response status is 404
