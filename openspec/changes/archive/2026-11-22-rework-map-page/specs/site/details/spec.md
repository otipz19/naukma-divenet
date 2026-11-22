## MODIFIED Requirements

### Requirement: The site page shows the safety disclaimer
The site page SHALL show the safety disclaimer of the active language in a box of its
own, and the box SHALL NOT be dismissible. It is shown on every visit, whether or not
the first-visit disclaimer dialog was dismissed.

#### Scenario: Disclaimer box
- **WHEN** a user opens a site page
- **THEN** the main content holds an alert with the disclaimer text and no dismiss control

#### Scenario: Shown after the dialog was dismissed
- **WHEN** the user chose "Don't show again" in the disclaimer dialog and opens a site page
- **THEN** the main content still holds the disclaimer alert

### Requirement: The disclaimer box reads as a sentence

The site page's disclaimer box SHALL start with a capital letter in every language.

#### Scenario: Ukrainian
- **WHEN** a visitor opens a site page in `uk`
- **THEN** the disclaimer box's text starts with "Інформація"
