# 0002. Modular monolith with Spring Modulith

Status: Accepted
Date: 2026-10-25

## Context
The back-end must be a monolith, but several agents work on different features in
parallel. Without enforced boundaries, features entangle through shared entities
and repositories.

## Decision
One Spring Boot application split into top-level packages per module (see
[ARCHITECTURE.md](../ARCHITECTURE.md#modules)). Spring Modulith's
`ApplicationModules.verify()` runs as a test in the quality gate. Cross-module
side effects use application events; references across modules are by ID.

## Consequences
- A module boundary violation fails the build, not just review.
- Slightly more ceremony (public service interfaces, events) than a flat layered app.
