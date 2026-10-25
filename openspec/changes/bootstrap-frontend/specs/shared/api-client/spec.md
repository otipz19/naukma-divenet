# Spec Delta

## Purpose

Gives the front-end one typed way to call the DiveNet REST API, so request paths
and payloads follow the shared contract and every failed call reaches the UI in
the same shape.

## ADDED Requirements

### Requirement: API calls go to the same-origin `/api/v1` base
The front-end SHALL send every REST call to paths under `/api/v1` on the origin
that served the app, so the same build works behind the dev proxy and behind nginx.

#### Scenario: Relative base path
- **WHEN** the client calls the operation at path `/sites`
- **THEN** the request URL is `<app origin>/api/v1/sites`

### Requirement: Error responses become one error type
When the API answers with a non-2xx status, the client SHALL fail the call with
one error type that carries the HTTP status and, when the body is an RFC 9457
problem document, its `title`, `detail`, `instance` and field `errors`.

#### Scenario: Problem document
- **WHEN** a call receives status 400 with an `application/problem+json` body that has `title`, `detail` and an `errors` list
- **THEN** the call fails with the error type
- **AND** the error exposes status 400, the `title`, the `detail` and each field error's `field` and `message`

#### Scenario: Error without a problem body
- **WHEN** a call receives status 502 with a non-JSON body
- **THEN** the call fails with the error type
- **AND** the error exposes status 502 and no problem fields

### Requirement: Network failures become the same error type
When a call cannot reach the API at all, the client SHALL fail it with the same
error type, marked as a network failure, instead of an untyped exception.

#### Scenario: API unreachable
- **WHEN** a call fails because the network request itself fails
- **THEN** the call fails with the error type
- **AND** the error is marked as a network failure and has no HTTP status
