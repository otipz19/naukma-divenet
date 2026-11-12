# Spec Delta

## MODIFIED Requirements

### Requirement: The web server proxies the API

Requests under `/api/` and `/media/` on the web port SHALL be forwarded to the
back-end, and the back-end's response SHALL reach the client unchanged,
including its status code and content type. The web server SHALL accept request
bodies large enough for a 10 MB upload with its multipart framing. The proxy
SHALL reuse a pool of connections to the back-end instead of opening a new
connection per request.

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

#### Scenario: The proxy answers a load run
- **WHEN** ~860 requests per second hit the proxied API through the stack's
  network for about two minutes
- **THEN** the proxy keeps reusing its back-end connections and no request
  fails with connection exhaustion.

#### Scenario: The stack starts in the right order
- **WHEN** the stack starts
- **THEN** the web service starts only after the back-end is reachable, so the
  proxy can resolve the back-end's name once at startup.
