# Spec Delta

## ADDED Requirements

### Requirement: Generated front-end types match the snapshot
The front-end SHALL contain API types generated from `api/openapi.json`. The
quality gate SHALL fail when they differ from what the generator produces from
the current snapshot. A gate run SHALL never write the generated file.

#### Scenario: Types are current
- **WHEN** the gate runs and the committed types equal the generator output for `api/openapi.json`
- **THEN** the types check passes

#### Scenario: Types are stale
- **WHEN** the gate runs after `api/openapi.json` changed and the types were not regenerated
- **THEN** the types check fails
- **AND** its message names the command that regenerates the types
- **AND** the committed types file is unchanged afterwards

### Requirement: The types can be regenerated on request
A documented command SHALL rewrite the generated front-end types from
`api/openapi.json`, after which the gate's types check passes.

#### Scenario: Regenerate the types
- **WHEN** a developer runs the documented regenerate command after the snapshot changed
- **THEN** the generated types file is rewritten
- **AND** a following gate run passes the types check
