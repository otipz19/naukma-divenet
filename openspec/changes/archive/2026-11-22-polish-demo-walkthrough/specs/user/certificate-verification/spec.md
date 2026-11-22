# Spec Delta

## MODIFIED Requirements

### Requirement: The Certificates tab works through the queue
The tab SHALL show each pending certificate's agency, level, number, holder linked to their profile, and photo when there is one, with Verify and Reject actions. Reject SHALL require a reason. A moderated card SHALL leave the queue, and a toast in the active language SHALL name the certificate, its holder and the decision.

#### Scenario: Card
- **WHEN** an admin opens the tab
- **THEN** each card shows those details

#### Scenario: Verify
- **WHEN** an admin presses Verify
- **THEN** the request is sent and the card leaves the queue
- **AND** a toast reads "Verified PADI Dry Suit Diver for Ingrid Larsen" for that certificate in `en`

#### Scenario: Reject needs a reason
- **WHEN** an admin presses Reject with no reason
- **THEN** a field error is shown and nothing is sent, and no toast is shown

#### Scenario: Reject
- **WHEN** an admin types a reason and presses Reject
- **THEN** the request carries the reason and the card leaves the queue
- **AND** a toast reads "Rejected PADI Dry Suit Diver for Ingrid Larsen" for that certificate in `en`

#### Scenario: Conflict
- **WHEN** the API answers 409
- **THEN** the tab shows an alert and reloads the queue, and no toast is shown

#### Scenario: Empty queue
- **WHEN** nothing is pending
- **THEN** the tab shows the empty-queue text of the active language
