# user/certificate-verification Specification

## Purpose

Defines how administrators verify declared certificates, so that a verified badge means someone has looked at the evidence.

## Requirements

### Requirement: Admins read the verification queue
`GET /api/v1/admin/certificates` SHALL return pending certificates, oldest first, as a paged response, with the number, photo, and the holder's id and display name. It SHALL need role `ADMIN`.

#### Scenario: Pending only
- **WHEN** an admin reads the queue and there is a pending and a verified certificate
- **THEN** only the pending one is returned, with its number and holder

#### Scenario: Not an admin
- **WHEN** a user with role `USER` reads the queue
- **THEN** the response is 403

### Requirement: Admins verify a certificate
`POST /api/v1/admin/certificates/{id}/verify` SHALL set a pending certificate to `VERIFIED` and answer with it.

#### Scenario: Verified
- **WHEN** an admin verifies a pending certificate
- **THEN** the response has status `VERIFIED`

### Requirement: Admins reject a certificate with a reason
`POST /api/v1/admin/certificates/{id}/reject` SHALL set a pending certificate to `REJECTED` with a reason of 1 to 500 characters and answer with it.

#### Scenario: Rejected
- **WHEN** an admin rejects a pending certificate with a reason
- **THEN** the response has status `REJECTED` and that reason

#### Scenario: No reason
- **WHEN** an admin rejects with a blank reason
- **THEN** the response is 400 with a field error for `reason`, and it stays pending

### Requirement: Only pending certificates can be moderated
Verifying or rejecting a certificate that is not pending SHALL answer 409, and an unknown one 404. Both SHALL need role `ADMIN`.

#### Scenario: Already moderated
- **WHEN** an admin verifies a verified certificate
- **THEN** the response is 409

#### Scenario: Unknown
- **WHEN** an admin verifies a certificate that does not exist
- **THEN** the response is 404

#### Scenario: Not an admin
- **WHEN** a user with role `USER` verifies their own certificate
- **THEN** the response is 403 and it stays pending

### Requirement: The Certificates tab works through the queue
The tab SHALL show each pending certificate's agency, level, number, holder linked to their profile, and photo when there is one, with Verify and Reject actions. Reject SHALL require a reason. A moderated card SHALL leave the queue.

#### Scenario: Card
- **WHEN** an admin opens the tab
- **THEN** each card shows those details

#### Scenario: Verify
- **WHEN** an admin presses Verify
- **THEN** the request is sent and the card leaves the queue

#### Scenario: Reject needs a reason
- **WHEN** an admin presses Reject with no reason
- **THEN** a field error is shown and nothing is sent

#### Scenario: Reject
- **WHEN** an admin types a reason and presses Reject
- **THEN** the request carries the reason and the card leaves the queue

#### Scenario: Conflict
- **WHEN** the API answers 409
- **THEN** the tab shows an alert and reloads the queue

#### Scenario: Empty queue
- **WHEN** nothing is pending
- **THEN** the tab shows the empty-queue text of the active language
