# shared/database Specification

## Purpose
Establishes the PostgreSQL database baseline: the schema is created only by
versioned migrations, and the spatial and trigram features that later
capabilities need are always available.

## Requirements

### Requirement: Migrations own the schema
On startup the back-end SHALL apply pending versioned migrations to the
configured database before serving requests. It SHALL refuse to start if the
mapped entities do not match the migrated schema, and it SHALL never create or
alter tables on its own.

#### Scenario: Start against an empty database
- **WHEN** the back-end starts against an empty PostgreSQL + PostGIS database
- **THEN** every migration is recorded as successfully applied in the migration history
- **AND** the application context starts

#### Scenario: Start against an already migrated database
- **WHEN** the back-end restarts against a database that already has every migration
- **THEN** no migration is applied again and the application context starts

### Requirement: Spatial and trigram extensions are enabled
After migration, the database SHALL have the `postgis` and `pg_trgm` extensions
installed.

#### Scenario: PostGIS is available
- **WHEN** the query `SELECT ST_Distance('SRID=4326;POINT(0 0)'::geography, 'SRID=4326;POINT(0 1)'::geography)` runs on the migrated database
- **THEN** it returns a value between 110000 and 112000 metres

#### Scenario: Trigram similarity is available
- **WHEN** the query `SELECT similarity('blue hole', 'blue holes')` runs on the migrated database
- **THEN** it returns a value greater than 0.5

### Requirement: Connection settings come from the environment
The back-end SHALL read the database URL, user name and password from
environment variables. The committed configuration SHALL contain no password
other than a local development default.

#### Scenario: Environment overrides the datasource
- **WHEN** the back-end starts with `DB_URL`, `DB_USERNAME` and `DB_PASSWORD` set
- **THEN** it connects using those values
