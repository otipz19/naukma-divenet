# Spec Delta

## MODIFIED Requirements

### Requirement: Clients read all sites as map markers
`GET /api/v1/sites/markers` SHALL return every site matching its optional filters as an
unpaged array, ordered by name, without authentication. With no filters it SHALL return
every site. Each marker SHALL have `id`, `name`, `lat`, `lng`, `countryCode`,
`regionCode`, `difficulty`, `minDepth` and `maxDepth`.

#### Scenario: Anonymous client reads the markers
- **GIVEN** a site named "Blue Hole" at latitude 28.5722 and longitude 34.5375 in the region `eg-dahab`
- **WHEN** a client without an access token requests `GET /api/v1/sites/markers`
- **THEN** the response is 200 with a JSON array
- **AND** the entry for that site has those values, with `countryCode` `EG`

#### Scenario: Markers are ordered by name
- **GIVEN** sites named "Canyon" and "Blue Hole"
- **WHEN** a client requests `GET /api/v1/sites/markers`
- **THEN** "Blue Hole" comes before "Canyon"
