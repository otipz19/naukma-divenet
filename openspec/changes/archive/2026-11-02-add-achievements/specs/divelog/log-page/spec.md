# divelog/log-page

## ADDED Requirements

### Requirement: The dive log page announces an unlocked achievement

After a saved dive earns an achievement, the dive log page SHALL show a live success alert naming it and describing it, until the next save or until the user starts another edit. A save that earns nothing SHALL show no alert.

#### Scenario: A save earns one

- **WHEN** a user saves a dive that earns `first-dive`
- **THEN** the page shows "Achievement unlocked" with its name and description

#### Scenario: A save earns two

- **WHEN** a user saves a dive that earns two achievements
- **THEN** the page names both

#### Scenario: A save earns nothing

- **WHEN** a user saves a dive that earns nothing
- **THEN** the page shows no alert

#### Scenario: The next save

- **WHEN** the alert is showing and the user saves another dive that earns nothing
- **THEN** the alert is gone
