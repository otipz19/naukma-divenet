# Spec Delta

## MODIFIED Requirements

### Requirement: The dive log page needs a signed-in user
`/dive-log` SHALL need a signed-in user, and the main navigation SHALL link to it for every visitor
except an admin. An admin who opens it SHALL be sent to `/admin/moderation`, as `auth` requires.

#### Scenario: Signed out
- **WHEN** a signed-out visitor opens `/dive-log`
- **THEN** the login page is shown, and logging in returns to `/dive-log`

#### Scenario: Navigation
- **WHEN** a visitor opens any page
- **THEN** the main navigation has a "Dive log" link to `/dive-log`

#### Scenario: No entry for the admin
- **WHEN** an admin opens any page
- **THEN** the main navigation has no "Dive log" link
