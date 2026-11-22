## MODIFIED Requirements

### Requirement: Every routed page is audited against WCAG 2.1 A and AA

The E2E suite SHALL scan every routed page of the app with axe-core against
the WCAG 2.1 A and AA rule tags, reaching pages through real flows with
seeded data (including an authenticated admin state for the moderation page),
and SHALL scan pages in both color themes and in the `uk` locale where the
rendered text changes with the locale. A page that opens dialogs SHALL also be
scanned with each of its form dialogs open.

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

#### Scenario: An open dialog is audited

- **WHEN** the audit suite opens the dive log dialog or the certificate dialog
- **THEN** the page is scanned while the dialog is open, so the dialog's own
  controls and names are checked.

#### Scenario: The disclaimer dialog is audited

- **WHEN** the audit suite opens `/` in a browser where the disclaimer was not dismissed
- **THEN** the page is scanned with the disclaimer dialog open, in the default
  and dark themes and in the `uk` locale.

#### Scenario: The phone map is audited

- **WHEN** the audit suite opens `/` on a 390 px wide viewport
- **THEN** the page is scanned with the results sheet expanded and again with
  the filters dialog open.
