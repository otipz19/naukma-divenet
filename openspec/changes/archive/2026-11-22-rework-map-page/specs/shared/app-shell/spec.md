## MODIFIED Requirements

### Requirement: Every page renders inside the app shell
Every route SHALL render inside one layout made of a header landmark followed by a
single main landmark holding the page content. The layout SHALL have no footer
landmark.

#### Scenario: Home page has the shell
- **WHEN** the app is opened at `/`
- **THEN** the page has exactly one banner and one main landmark, and no contentinfo landmark
- **AND** the page content is inside the main landmark

#### Scenario: Not-found page has the shell
- **WHEN** the app is opened at `/no-such-page`
- **THEN** the page has the banner and main landmarks
- **AND** the not-found message is inside the main landmark

### Requirement: The header has a language switch
The header SHALL contain a labelled group of two toggle buttons, "EN" and "UK",
in both locales. The button of the active locale SHALL be pressed and the other
not. Pressing a button SHALL make its locale active, which saves the choice and
updates the document language as `shared/i18n` requires.

#### Scenario: Active locale is pressed
- **WHEN** the app is opened with active locale `en`
- **THEN** the "EN" button is pressed and the "UK" button is not

#### Scenario: Switch to Ukrainian
- **WHEN** the user presses the "UK" button
- **THEN** the page text, including the header, shows the `uk` text
- **AND** the "UK" button is pressed
- **AND** the saved language choice is `uk`
- **AND** the `<html>` element has `lang="uk"`

## REMOVED Requirements

### Requirement: The footer shows the safety disclaimer
**Reason**: The owner removed the footer (review finding F-03). It made the map page
scroll, and on a narrow window it was about 376 px tall.
**Migration**: The disclaimer opens in a first-visit dialog (`shared/disclaimer`). The
site page keeps its disclaimer box, which cannot be dismissed (`site/details`). The
OpenStreetMap credit stays in each tiled map's attribution control (`site/map`).
