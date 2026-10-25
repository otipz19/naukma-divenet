# Spec Delta

## Purpose

Keeps a committed, machine-readable description of the REST API that always
matches the running back-end, so the front-end and reviewers can rely on it as
the shared contract.

## ADDED Requirements

### Requirement: The API publishes an OpenAPI document
The back-end SHALL serve an OpenAPI 3 document describing every endpoint under
`/api/v1` at `GET /v3/api-docs`, and an interactive viewer at `/swagger-ui.html`.

#### Scenario: OpenAPI document is served
- **WHEN** a client sends `GET /v3/api-docs`
- **THEN** the response status is 200
- **AND** the body is a JSON document whose `openapi` field starts with `3.`

### Requirement: The committed snapshot matches the running API
The repository SHALL contain `api/openapi.json`, a normalised copy of the
generated document (stable key order, pretty-printed, LF line endings). The
quality gate SHALL fail when the generated document differs from the snapshot.

#### Scenario: Snapshot is current
- **WHEN** the quality gate runs and the generated document equals `api/openapi.json`
- **THEN** the contract check passes

#### Scenario: Snapshot is stale
- **WHEN** the quality gate runs and the generated document differs from `api/openapi.json`
- **THEN** the contract check fails
- **AND** its message names the command that regenerates the snapshot

### Requirement: The snapshot can be regenerated on request
A documented command SHALL rewrite `api/openapi.json` from the running API. A
normal gate run SHALL never write the file.

#### Scenario: Regenerate the snapshot
- **WHEN** a developer runs the documented regenerate command
- **THEN** `api/openapi.json` is rewritten
- **AND** a following gate run passes the contract check

#### Scenario: Gate run leaves the snapshot untouched
- **WHEN** the quality gate runs with a stale snapshot
- **THEN** `api/openapi.json` is unchanged afterwards
