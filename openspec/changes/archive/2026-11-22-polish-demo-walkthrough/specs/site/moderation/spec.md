# Spec Delta

## MODIFIED Requirements

### Requirement: The moderation page approves and rejects
Each card SHALL show the site's facts, author and a link to its location on OpenStreetMap, with
Approve and Reject actions. Reject SHALL require a reason. A moderated card SHALL leave the queue,
and a toast in the active language SHALL name the site and the decision.

#### Scenario: Approve
- **WHEN** an admin presses Approve on a card
- **THEN** the approve request is sent and the card leaves the queue
- **AND** a toast reads "Nereo Cave approved" for a site named "Nereo Cave" in `en`

#### Scenario: Reject needs a reason
- **WHEN** an admin presses Reject with an empty reason
- **THEN** a field error is shown and nothing is sent, and no toast is shown

#### Scenario: Reject
- **WHEN** an admin types a reason and presses Reject
- **THEN** the reject request carries the reason and the card leaves the queue
- **AND** a toast reads "Nereo Cave rejected" for a site named "Nereo Cave" in `en`

#### Scenario: Toast in Ukrainian
- **WHEN** an admin approves a site with active language `uk`
- **THEN** the toast text is the `uk` text with the site's name

#### Scenario: Empty queue
- **WHEN** the queue is empty
- **THEN** the page shows the empty-queue text of the active language

#### Scenario: Conflict
- **WHEN** the API answers 409 because another admin already acted
- **THEN** the page shows an alert and reloads the queue, and no toast is shown
