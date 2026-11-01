# Spec Delta

## MODIFIED Requirements

### Requirement: Clients read all sites as map markers
`GET /api/v1/sites/markers` SHALL return every approved site matching its optional filters as an
unpaged array, ordered by name, without authentication. With no filters it SHALL return
every approved site. Each marker SHALL have `id`, `name`, `lat`, `lng`, `countryCode`,
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

#### Scenario: Unapproved sites are hidden
- **GIVEN** a pending site and a rejected site
- **WHEN** a client requests `GET /api/v1/sites/markers`, even as their author or an admin
- **THEN** neither is returned

### Requirement: Clients read one site's details
`GET /api/v1/sites/{id}` SHALL return the marker fields of the site plus `description`,
`requiredGear`, `recommendedGear`, `status` and `rejectionReason`, without authentication. The gear
fields SHALL be arrays of gear codes, sorted by code. An unapproved site SHALL be returned only
to its author and to admins; for anyone else the answer SHALL be the same as for an unknown site.

#### Scenario: Anonymous client reads a site
- **GIVEN** a site that requires `torch` and `smb`, and recommends `nitrox`
- **WHEN** a client without an access token requests that site
- **THEN** the response is 200 with its description
- **AND** `requiredGear` is `["smb", "torch"]` and `recommendedGear` is `["nitrox"]`

#### Scenario: Unknown site
- **WHEN** a client requests `GET /api/v1/sites/999999` and no such site exists
- **THEN** the response is a 404 problem detail

#### Scenario: Pending site for others
- **GIVEN** a pending site
- **WHEN** an anonymous client, or a signed-in user who is not its author, requests it
- **THEN** the response is a 404 problem detail

#### Scenario: Pending site for its author and admins
- **GIVEN** a pending site
- **WHEN** its author or an admin requests it
- **THEN** the response is 200 with status `PENDING`

### Requirement: The demo profile seeds real sites
When the `demo` profile is active and no site exists, startup SHALL create at least 50
approved sites from the bundled seed, covering every seeded country. Without that profile, startup
SHALL create no sites.

#### Scenario: Demo profile on an empty database
- **WHEN** the application starts with the `demo` profile and no sites
- **THEN** at least 50 approved sites exist
- **AND** every country has at least one site

#### Scenario: Demo profile on a seeded database
- **WHEN** the seeder runs again after sites exist
- **THEN** the number of sites does not change

#### Scenario: No demo profile
- **WHEN** the application starts without the `demo` profile
- **THEN** no sites exist
