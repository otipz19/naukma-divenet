# site/catalog Specification

## Purpose

Defines the dive-site data, the public endpoints clients use to read it, and the demo
seed that keeps a demonstration from starting empty.

## Requirements

### Requirement: Clients read all sites as map markers
`GET /api/v1/sites/markers` SHALL return every site as an unpaged array, without
authentication. Each marker SHALL have `id`, `name`, `lat`, `lng`, `countryCode`,
`regionCode`, `difficulty`, `minDepth` and `maxDepth`.

#### Scenario: Anonymous client reads the markers
- **GIVEN** a site named "Blue Hole" at latitude 28.5722 and longitude 34.5375 in the region `eg-dahab`
- **WHEN** a client without an access token requests `GET /api/v1/sites/markers`
- **THEN** the response is 200 with a JSON array
- **AND** the entry for that site has those values, with `countryCode` `EG`

### Requirement: Clients read one site's details
`GET /api/v1/sites/{id}` SHALL return the marker fields of the site plus `description`,
`requiredGear` and `recommendedGear`, without authentication. The gear fields SHALL be
arrays of gear codes, sorted by code.

#### Scenario: Anonymous client reads a site
- **GIVEN** a site that requires `torch` and `smb`, and recommends `nitrox`
- **WHEN** a client without an access token requests that site
- **THEN** the response is 200 with its description
- **AND** `requiredGear` is `["smb", "torch"]` and `recommendedGear` is `["nitrox"]`

#### Scenario: Unknown site
- **WHEN** a client requests `GET /api/v1/sites/999999` and no such site exists
- **THEN** the response is a 404 problem detail

### Requirement: Stored sites keep their values valid
The database SHALL refuse a site whose declared difficulty is outside 1 to 5, or whose
minimum depth is negative or above its maximum depth. A gear item SHALL be either
required or recommended for a site, not both.

#### Scenario: Invalid difficulty
- **WHEN** a site with difficulty 6 is inserted
- **THEN** the database refuses it

#### Scenario: Depths in the wrong order
- **WHEN** a site with a minimum depth of 30 and a maximum depth of 10 is inserted
- **THEN** the database refuses it

#### Scenario: Gear listed twice
- **WHEN** one gear item is stored as both required and recommended for one site
- **THEN** the database refuses it

### Requirement: The demo profile seeds real sites
When the `demo` profile is active and no site exists, startup SHALL create at least 50
sites from the bundled seed, covering every seeded country. Without that profile, startup
SHALL create no sites.

#### Scenario: Demo profile on an empty database
- **WHEN** the application starts with the `demo` profile and no sites
- **THEN** at least 50 sites exist
- **AND** every country has at least one site

#### Scenario: Demo profile on a seeded database
- **WHEN** the seeder runs again after sites exist
- **THEN** the number of sites does not change

#### Scenario: No demo profile
- **WHEN** the application starts without the `demo` profile
- **THEN** no sites exist
