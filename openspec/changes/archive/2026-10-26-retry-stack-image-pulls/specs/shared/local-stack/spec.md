# Spec Delta

## MODIFIED Requirements

### Requirement: The gate and CI verify the stack
The quality gate SHALL validate the compose configuration without building
images, and fail on any violation of the requirements above that the rendered
configuration shows. CI SHALL also run a smoke test that starts the real stack
and checks the scenarios above that need it running.

#### Scenario: Gate rejects a broken configuration
- **WHEN** the gate runs and a service in `compose.yaml` has no health check
- **THEN** the compose step fails and names that service

#### Scenario: Smoke test cleans up
- **WHEN** the smoke test finishes, whether its checks passed or failed
- **THEN** its compose project's containers, network and volumes are removed
- **AND** its exit code is non-zero if any check failed

#### Scenario: Transient image pull failure is retried
- **WHEN** pulling one of the stack's images fails and a later attempt, within the retry limit of 3 attempts, succeeds
- **THEN** the smoke test goes on to start the stack and run its checks
- **AND** its exit code is 0 if every check passes

#### Scenario: Image pull keeps failing
- **WHEN** every attempt to pull one of the stack's images fails
- **THEN** the smoke test does not start the stack and exits non-zero
- **AND** its output names that image
- **AND** its compose project's containers, network and volumes are removed
