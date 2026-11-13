# Spec Delta

## Purpose

The hardening layers around the product that CI keeps honest: production
dependencies are audited for known vulnerabilities, the served app's images are
scanned for unfixed high-severity findings, and the web server tells browsers a
strict content security policy and the standard protective headers.

## ADDED Requirements

### Requirement: Production dependencies are audited in the gate

CI SHALL audit the workspace's production dependencies against the package
lockfile and fail when a high or critical severity advisory affects one of
them.

#### Scenario: A high-severity advisory fails the audit

- **WHEN** a production dependency of the workspace carries an advisory with
  high or critical severity
- **THEN** the audit step in CI fails and names the affected package.

#### Scenario: Dev-only advisories do not fail the audit

- **WHEN** an advisory affects only a development dependency
- **THEN** the audit step passes, because the shipped product is unaffected.

### Requirement: Stack images are scanned for unfixed high-severity findings

CI SHALL build the stack's images and scan them for known vulnerabilities,
failing when a high or critical severity finding with an available fix affects
either image. The scan SHALL cover the backend image's Java dependencies.

#### Scenario: A fixable critical finding fails the scan

- **WHEN** an image carries a vulnerability of high or critical severity that
  has an available fix
- **THEN** the scan fails and names the vulnerable component and its fix
  status.

#### Scenario: Findings without a fix do not block

- **WHEN** an image carries a vulnerability of high or critical severity for
  which no fix exists yet
- **THEN** the scan reports it but does not fail the gate.

### Requirement: The web server sets browser security headers

The web server SHALL send a strict content security policy and the standard
protective headers on the responses that serve the single-page app.

#### Scenario: The served app carries the header set

- **WHEN** a client requests a document from the web server
- **THEN** the response carries a content security policy with
  `default-src 'self'`, `script-src 'self'`, `frame-ancestors 'none'`,
  `object-src 'none'`, `base-uri 'self'` and `form-action 'self'`, allowing
  only what the app needs: its own styles, its own images including inline
  data and blob previews, and its own connections
- **AND** the response carries `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and
  `Referrer-Policy: strict-origin-when-cross-origin`.

#### Scenario: The E2E suite asserts the policy

- **WHEN** the E2E suite runs against the stack
- **THEN** its stack-up journey asserts the protective headers and the
  restrictive clauses of the content security policy, so removing a
  protection fails the suite.
