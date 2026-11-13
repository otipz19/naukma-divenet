# shared/accessibility Specification

## Purpose

Automated accessibility audits of the rendered app: every routed page is
scanned against the WCAG 2.1 A and AA rule sets in its rendered, data-carrying
state, with a declared pass/fail policy that the E2E suite and CI keep green.

## Requirements


### Requirement: Every routed page is audited against WCAG 2.1 A and AA

The E2E suite SHALL scan every routed page of the app with axe-core against
the WCAG 2.1 A and AA rule tags, reaching pages through real flows with
seeded data (including an authenticated admin state for the moderation page),
and SHALL scan pages in both color themes and in the `uk` locale where the
rendered text changes with the locale.

#### Scenario: A page is audited with data in both themes

- **WHEN** the audit suite runs against a page carrying seeded content
- **THEN** the page is scanned in the default and dark themes, and each scan
  uses the live rendered DOM.

#### Scenario: The page respects both theme settings

- **WHEN** the system color-scheme preference is dark and the document carries
  no theme attribute, or one that does not pin another theme
- **THEN** the stylesheet applies the dark tokens through its
  `prefers-color-scheme` block, and an attribute explicitly pinning a theme
  overrides the system preference.

#### Scenario: Translated chrome is audited

- **WHEN** a page whose labels change with the locale is audited
- **THEN** it is scanned in the `uk` locale as well as the default, so unnamed
  elements introduced by a missing translation fail the audit.

### Requirement: Violations fail the suite by declared impact

The audit SHALL fail when an unaccepted violation of impact `critical` or
`serious` is found, and SHALL report `moderate` and `minor` findings without
failing. An accepted exception SHALL be declared in a visible list with a
rule id and a reason, and the suite SHALL fail when a declared exception
matches nothing, so the list cannot silently allow rules that no longer apply.

#### Scenario: A serious violation fails the audit

- **WHEN** a scanned page carries an unaccepted `serious` or `critical`
  violation
- **THEN** the test fails and names the rule, its impact, the violating
  selector and the fix documentation.

#### Scenario: An accepted exception is kept honest

- **WHEN** a rule listed as accepted matches no violation on any audited page
- **THEN** the suite fails and names the stale exception.

### Requirement: Findings are triaged and the suite ends green

Every `critical` or `serious` violation found when the audits first run SHALL
be either fixed in the product (markup, labels, contrast tokens) or moved to
the accepted-exceptions list with a written reason, and the suite SHALL be
green with zero unaccepted critical or serious findings when the change
completes.

#### Scenario: The triaged suite is green

- **WHEN** the audit suite runs on the seeded stack after triage
- **THEN** every finding is fixed or accepted, and the run passes.
