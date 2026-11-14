# shared/modern-web Specification

## Purpose

The web platform usage of the product is audited against the project's
modern-web guidance corpus: scoped topics are retrieved and checked, findings
are triaged into fixed or accepted with written reasons, and the mechanical
legacy scan stays clean.

## Requirements


### Requirement: The guidance corpus is audited per scoped topic

The project SHALL audit its web platform usage against the scoped topics of
the modern-web guidance corpus (forms and validation feedback, theming,
user-content security, media, lists and overlays, dates and i18n, SPA
behavior, and cross-checks of finished work), producing a ledger with one
verdict per topic: pass, fixed with a diff reference, accepted with a written
reason, or not applicable with one line of why. The ledger SHALL record the
corpus version audited.

#### Scenario: The ledger covers the scoped topics

- **WHEN** the audit completes
- **THEN** every scoped topic has a verdict in the ledger, and the ledger
  names the corpus version it was produced against.

#### Scenario: A topic that does not apply is recorded

- **WHEN** a retrieved guide turns out not to apply to the product
- **THEN** the ledger records a not-applicable verdict with one line of why,
  instead of silently dropping the topic.

### Requirement: Native UI follows the active color scheme

The stylesheet SHALL declare the `color-scheme` CSS property so that native
controls, scrollbars and the canvas match the active theme, with the same
activation paths as the themed custom properties: the explicit theme
attribute, and the system preference when the attribute does not pin another
theme.

#### Scenario: Native UI matches the active theme

- **WHEN** the dark theme is active, by attribute or by system preference
- **THEN** the root element's computed `color-scheme` resolves to `dark`, and
  the light theme resolves it to `light`.

#### Scenario: The theme audit asserts the declaration

- **WHEN** the theme contract test runs
- **THEN** it asserts the computed `color-scheme` per activation path, next
  to the token assertions it already makes.

### Requirement: Findings are triaged with the smallest required diff

Every guide requirement violated by the product SHALL be either fixed with the
smallest diff the requirement demands, or recorded as accepted in the ledger
with the guide's own requirement text quoted and the hypothetical follow-up
named. The mechanical legacy scan SHALL stay at zero findings.

#### Scenario: A violated mandatory requirement is fixed or accepted

- **WHEN** a scoped guide's mandatory requirement is not met
- **THEN** the change either fixes it with a local diff or records it as
  accepted quoting the requirement, and the legacy scan reports no findings.
