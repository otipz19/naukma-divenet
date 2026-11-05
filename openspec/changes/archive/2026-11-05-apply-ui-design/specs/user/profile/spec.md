# user/profile

## ADDED Requirements

### Requirement: The profile header shows the dive statistics

When the dive statistics are visible, the profile page SHALL show them in its header, beside the name, as `Profile.html` draws them, and not again further down.

#### Scenario: Statistics in the header
- **WHEN** a visitor opens a profile whose statistics are visible
- **THEN** the dives, sites and deepest dive are inside the header, and appear once on the page

#### Scenario: Statistics hidden
- **WHEN** a visitor opens a profile whose statistics are hidden
- **THEN** the header shows no statistics
