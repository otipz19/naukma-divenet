# Spec Delta

## ADDED Requirements

### Requirement: The site page shows an unapproved site's status
For a pending or rejected site, the page SHALL show a notice with the status in the active
language and any rejection reason. An approved site SHALL show no such notice.

#### Scenario: Pending site
- **WHEN** the author opens a pending site's page
- **THEN** the page shows the pending notice

#### Scenario: Rejected site
- **WHEN** the author opens a rejected site's page
- **THEN** the page shows the rejected notice with the reason

#### Scenario: Approved site
- **WHEN** a visitor opens an approved site's page
- **THEN** no status notice is shown

### Requirement: The site page waits for the session
The page SHALL request the site only after the session has been restored, so an author who
reloads their own unapproved site's page is not shown the not-found message.

#### Scenario: Reload by the author
- **WHEN** a signed-in author reloads a pending site's page
- **THEN** the site request carries the access token and the page shows the site
