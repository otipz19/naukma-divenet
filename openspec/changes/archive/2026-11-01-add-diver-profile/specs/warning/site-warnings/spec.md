# Spec Delta

## ADDED Requirements

### Requirement: A warning's author links to their profile
The author's name in a warning's title SHALL link to `/users/{id}`.

#### Scenario: Warning shown
- **WHEN** a warning by a user is shown on the site page
- **THEN** the title has a link with the author's name whose target is that user's profile
