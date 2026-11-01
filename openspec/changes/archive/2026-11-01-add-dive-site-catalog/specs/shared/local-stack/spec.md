# Spec Delta

## ADDED Requirements

### Requirement: The stack starts with demo data by default
The compose stack SHALL pass `SPRING_PROFILES_ACTIVE` to the back-end, defaulting to
`demo`, so a fresh stack shows seeded sites. Setting the variable in the env file SHALL
override the default.

#### Scenario: Variable not set
- **WHEN** the compose configuration is rendered without `SPRING_PROFILES_ACTIVE`
- **THEN** the back-end's `SPRING_PROFILES_ACTIVE` is `demo`

#### Scenario: Variable set
- **WHEN** the compose configuration is rendered with `SPRING_PROFILES_ACTIVE=prod`
- **THEN** the back-end's `SPRING_PROFILES_ACTIVE` is `prod`
