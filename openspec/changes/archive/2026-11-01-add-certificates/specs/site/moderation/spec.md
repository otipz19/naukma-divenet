# Spec Delta

## ADDED Requirements

### Requirement: The moderation page has a tab for each queue
The page SHALL have Sites and Certificates tabs, each showing its pending count, with Sites first. The active tab SHALL be kept in the URL.

#### Scenario: Default tab
- **WHEN** an admin opens `/admin/moderation`
- **THEN** the Sites tab is selected and shows the sites queue

#### Scenario: Switching
- **WHEN** an admin selects Certificates
- **THEN** the certificates queue is shown, and the URL has `tab=certificates`

#### Scenario: Opening a tab by URL
- **WHEN** an admin opens `/admin/moderation?tab=certificates`
- **THEN** the Certificates tab is selected
