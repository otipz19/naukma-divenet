# Architecture decision records

Short records of decisions that affect the whole project. Add one when a change
introduces a project-wide rule or departs from [ARCHITECTURE.md](../ARCHITECTURE.md).
File name: `NNNN-kebab-title.md`. Never edit an accepted ADR's decision; supersede it
with a new ADR and set the old one's status to `Superseded by NNNN`.

Template:

```markdown
# NNNN. Title

Status: Proposed | Accepted | Superseded by NNNN
Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-technology-stack.md) | Technology stack | Accepted |
| [0002](0002-modular-monolith.md) | Modular monolith with Spring Modulith | Superseded by 0008 |
| [0003](0003-postgis-hibernate-flyway.md) | PostgreSQL + PostGIS via Hibernate Spatial, schema by Flyway | Accepted |
| [0004](0004-jwt-authentication.md) | JWT access tokens with rotating refresh cookie | Accepted |
| [0005](0005-frontend-stack.md) | Front-end libraries, map and i18n | Accepted |
| [0006](0006-local-media-storage.md) | Local-disk media behind `MediaStorage` | Accepted |
| [0007](0007-planning-workflow.md) | Planning with project docs + OpenSpec | Accepted |
| [0008](0008-layered-monolith.md) | Plain layered monolith | Accepted |
