# user/profile

## ADDED Requirements

### Requirement: The profile page shows achievements

The profile page SHALL show the diver's achievements with a count of those earned. An earned one SHALL show its name, description and date. A locked one SHALL show its name, description and, when given, a labelled progress bar with its numbers.

#### Scenario: Earned

- **WHEN** a visitor opens a profile with an earned achievement
- **THEN** its card shows the name, description and earned date, and the section shows the earned count

#### Scenario: Locked with progress

- **WHEN** a visitor opens a profile with a locked achievement at 3 of 10
- **THEN** its card shows a progress bar with the value 3 of 10, and "3 / 10"

#### Scenario: Locked without progress

- **WHEN** a visitor opens a profile that hides statistics
- **THEN** locked cards show no progress bar

#### Scenario: In Ukrainian

- **WHEN** a visitor reads a profile in `uk`
- **THEN** names and descriptions are in Ukrainian

#### Scenario: Load failure

- **WHEN** the achievements fail to load
- **THEN** the section shows an alert, and the rest of the profile stays
