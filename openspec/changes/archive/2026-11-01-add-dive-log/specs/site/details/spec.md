# Spec Delta

## ADDED Requirements

### Requirement: The site page links to logging a dive
An approved site's page SHALL have a "Log a dive here" link to `/dive-log?site={id}`. A pending or rejected site's page SHALL NOT.

#### Scenario: Approved site
- **WHEN** a visitor opens an approved site's page
- **THEN** the link is shown with the site's id

#### Scenario: Pending site
- **WHEN** the author opens a pending site's page
- **THEN** the link is not shown
