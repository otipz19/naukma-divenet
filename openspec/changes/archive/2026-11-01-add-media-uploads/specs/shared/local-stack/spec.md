# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Uploaded media survives a restart
The back-end SHALL keep uploaded media in a named volume, so stopping and starting the stack
without removing volumes keeps every upload and its thumbnail.

#### Scenario: Media directory is on a named volume
- **WHEN** the compose configuration is rendered with `.env.example`
- **THEN** the back-end's media directory is mounted from a named volume

#### Scenario: Restart keeps an upload
- **WHEN** an image is uploaded, and the stack is stopped with `docker compose down` (no `-v`) and started again
- **THEN** `GET /media/{id}` and `GET /media/{id}/thumb` on the web port return 200 for that upload
