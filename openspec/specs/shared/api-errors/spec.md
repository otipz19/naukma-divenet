# shared/api-errors Specification

## Purpose
Defines the single error response format that every DiveNet API endpoint uses, so
clients can handle failures uniformly and never see internal details.

## Requirements

### Requirement: Errors are RFC 9457 problem details
Every error response from an endpoint under `/api/` SHALL have the content type
`application/problem+json`. Its body SHALL contain `title`, `status` and
`instance`, and `status` SHALL equal the HTTP status code. An absent `type` means
`about:blank`, as RFC 9457 defines.

#### Scenario: Unknown API path
- **WHEN** a client sends `GET /api/v1/does-not-exist`
- **THEN** the response status is 404
- **AND** the content type is `application/problem+json`
- **AND** the body has `status` 404 and `instance` `/api/v1/does-not-exist`

#### Scenario: Unsupported HTTP method
- **WHEN** a client calls an existing API path with a method it does not support
- **THEN** the response status is 405 with an `application/problem+json` body whose `status` is 405

### Requirement: Validation errors list each invalid field
A request rejected by bean validation or for an unreadable body SHALL return
status 400 as a problem detail. Field validation failures SHALL add an `errors`
array with one `{ "field", "message" }` entry per invalid field.

#### Scenario: Invalid request body field
- **WHEN** a client posts a JSON body in which a required field is blank
- **THEN** the response status is 400
- **AND** the body's `errors` array contains an entry whose `field` names that field

#### Scenario: Malformed JSON body
- **WHEN** a client posts a body that is not valid JSON
- **THEN** the response status is 400 with an `application/problem+json` body

### Requirement: Unexpected errors hide internal details
An unhandled exception SHALL produce status 500 as a problem detail with a
generic `detail`. The response SHALL NOT contain the exception message, class
name or stack trace. The server SHALL log the exception.

#### Scenario: Handler throws an unexpected exception
- **WHEN** an endpoint throws an unchecked exception with the message `secret-internal-state`
- **THEN** the response status is 500 with an `application/problem+json` body
- **AND** the response body does not contain `secret-internal-state`, the exception class name or `at ua.ukma`
