# geo Specification

## Purpose

Defines the fixed country and region hierarchy that sites and posts refer to, and
how clients read it to fill location filters and forms.

## Requirements

### Requirement: Countries and regions are readable by anyone
`GET /api/v1/countries` SHALL return every country with its regions, as an unpaged
array, without authentication. A country SHALL have `code`, `name` and `regions`;
a region SHALL have `code` and `name`.

#### Scenario: Anonymous client reads the hierarchy
- **WHEN** a client without an access token requests `GET /api/v1/countries`
- **THEN** the response is 200 with a JSON array
- **AND** the entry with code `EG` has the name `Egypt` and lists a region with the code `eg-dahab` and the name `Dahab`

### Requirement: The hierarchy has a stable order
Countries SHALL be ordered by English name, and the regions of each country SHALL be
ordered by English name.

#### Scenario: Countries and regions are sorted
- **WHEN** a client requests `GET /api/v1/countries`
- **THEN** the countries are in ascending order of `name`
- **AND** the regions inside each country are in ascending order of `name`

### Requirement: Every country has at least one region
The seeded data SHALL give every country at least one region, and every region SHALL
belong to exactly one country.

#### Scenario: No empty country
- **WHEN** a client requests `GET /api/v1/countries`
- **THEN** every country has a non-empty `regions` array

### Requirement: Codes are stable and unique
Country codes SHALL be ISO 3166-1 alpha-2 codes. Region codes SHALL be lower-case
kebab-case, start with the lower-case country code, and be unique across all countries.

#### Scenario: Code formats
- **WHEN** a client requests `GET /api/v1/countries`
- **THEN** every country code matches `^[A-Z]{2}$`
- **AND** every region code matches `^[a-z]{2}(-[a-z0-9]+)+$` and starts with its country's code in lower case
- **AND** no region code appears twice

### Requirement: Every country and region has a display name in each language
Every seeded country and region code SHALL have an entry in the `en` and `uk` locale
files, and those files SHALL hold no entry for a code that is not seeded.

#### Scenario: Seeded codes and locale keys match
- **WHEN** the seeded country and region codes are compared with the keys under `geo.countries` and `geo.regions` in the `en` locale
- **THEN** the two sets are equal
