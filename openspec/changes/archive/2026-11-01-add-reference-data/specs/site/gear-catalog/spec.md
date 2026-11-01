# Spec Delta

## Purpose

Defines the fixed list of gear items that a site can require or recommend, and how
clients read it to fill filters and forms.

## ADDED Requirements

### Requirement: Gear items are readable by anyone
`GET /api/v1/gear-items` SHALL return every gear item as an unpaged array, ordered by
English name, without authentication. A gear item SHALL have `code` and `name`.

#### Scenario: Anonymous client reads the catalog
- **WHEN** a client without an access token requests `GET /api/v1/gear-items`
- **THEN** the response is 200 with a JSON array in ascending order of `name`
- **AND** it includes the items with the codes `torch`, `drysuit`, `smb`, `nitrox` and `reef-hook`

### Requirement: Gear codes are stable and unique
Gear codes SHALL be lower-case kebab-case and unique.

#### Scenario: Code format
- **WHEN** a client requests `GET /api/v1/gear-items`
- **THEN** every code matches `^[a-z0-9]+(-[a-z0-9]+)*$`
- **AND** no code appears twice

### Requirement: Every gear item has a display name in each language
Every seeded gear code SHALL have an entry in the `en` and `uk` locale files, and those
files SHALL hold no entry for a code that is not seeded.

#### Scenario: Seeded codes and locale keys match
- **WHEN** the seeded gear codes are compared with the keys under `gear` in the `en` locale
- **THEN** the two sets are equal
