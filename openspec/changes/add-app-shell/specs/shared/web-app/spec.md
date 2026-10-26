# Spec Delta

## MODIFIED Requirements

### Requirement: The app serves a placeholder home page
Until the map page exists, the root path `/` SHALL render a placeholder page
inside the app shell that shows the product name as the page's top-level heading
and a short notice, both taken from the active locale.

#### Scenario: Home page renders
- **WHEN** the app is opened at `/`
- **THEN** the main landmark shows a top-level heading with the product name "DiveNet"
- **AND** it shows the placeholder notice text of the active locale
