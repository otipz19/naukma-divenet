# 0003. PostgreSQL + PostGIS via Hibernate Spatial, schema by Flyway

Status: Accepted
Date: 2026-10-25

## Context
Sites are geographic points queried by map viewport, distance and region; the map
must filter quickly. Spring Boot 4 ships Hibernate ORM 7, whose `hibernate-spatial`
module supports PostGIS types and functions.

## Decision
- Store locations as `geography(Point,4326)` with a GiST index, mapped to JTS `Point`.
- Use HQL spatial functions where convenient and native SQL (`ST_MakeEnvelope`,
  `ST_DWithin`) for viewport and radius queries.
- Flyway owns the schema; Hibernate runs with `ddl-auto=validate`.
- Integration tests use Testcontainers with the `postgis/postgis` image; no H2.
- DTOs expose `lat`/`lng` numbers; JTS types never reach JSON.

## Consequences
- Back-end integration tests and the gate require Docker.
- Spatial column DDL is written by hand in migrations.
