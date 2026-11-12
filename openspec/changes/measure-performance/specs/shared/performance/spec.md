# Spec Delta

## Purpose

Repeatable performance measurement of the running stack: load tests with
pass/fail thresholds against the public API, a front-end performance budget, and
one command and one CI job that keep both green.

## ADDED Requirements

### Requirement: Load tests exercise the public API under declared thresholds

The performance suite SHALL run k6 scenarios against the compose stack with the
demo profile active, covering the site map search, a site's details with its
reviews and warnings, the feed, and the login endpoint. Each scenario SHALL
declare thresholds on p95 response time and the error rate, and the run SHALL
fail when any threshold is crossed.

#### Scenario: A load run passes on the seeded stack

- **WHEN** the performance suite runs against a freshly started, seeded stack
- **THEN** every scenario stays under its declared p95 and error-rate
  thresholds, and the run reports each scenario's measured p95 and error rate.

#### Scenario: A crossed threshold fails the run

- **WHEN** a scenario's measured p95 latency or error rate crosses its declared
  threshold
- **THEN** the run exits non-zero and names the scenario and the threshold that
  failed.

### Requirement: The SPA keeps a declared performance budget

The performance suite SHALL run a Lighthouse check against the served SPA and
assert a declared budget on its performance metrics (first contentful paint,
largest contentful paint) and on its total transferred page weight, failing the
run when a budget is crossed.

#### Scenario: The served SPA meets the budget

- **WHEN** the Lighthouse check runs against the stack's web server
- **THEN** the measured metrics and page weight are within the declared budget
  and the check prints them.

#### Scenario: A crossed budget fails the run

- **WHEN** a Lighthouse metric or the page weight crosses its declared budget
- **THEN** the run exits non-zero and names the crossed budget.

### Requirement: One command runs the suite against a fresh stack

A single command SHALL start the stack from the committed compose configuration
under a dedicated compose project and port that do not collide with the
developer stack, the smoke stack or the E2E stack, wait until the demo seed is
loaded, run the load tests and the Lighthouse check, and tear the stack down
when the run ends, whatever its outcome. The suite SHALL NOT be part of the
standard quality gate.

#### Scenario: The command runs the whole suite and cleans up

- **WHEN** the performance command runs on a machine with Docker and k6
- **THEN** the stack comes up seeded, both checks run, and afterwards no
  containers or volumes of the performance project remain.

#### Scenario: The load tool cannot start

- **WHEN** the performance command runs on a machine where the pinned k6 image
  cannot be pulled or started
- **THEN** the run fails fast with a message that names what failed and stops
  the stack it started.

### Requirement: CI runs the performance suite

CI SHALL run the performance suite on every pull request as its own job,
separate from the standard quality gate, and the job SHALL fail the pipeline
when a threshold or budget is crossed.

#### Scenario: A pull request runs the performance suite

- **WHEN** a pull request is opened or updated
- **THEN** CI starts the stack, runs the performance suite, and the pipeline
  fails if any threshold or budget is crossed.
