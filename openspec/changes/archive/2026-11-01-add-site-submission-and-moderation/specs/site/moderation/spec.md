# Spec Delta

## Purpose

Defines how administrators review submitted dive sites, so that only checked information
reaches the public map.

## ADDED Requirements

### Requirement: Admins read the moderation queue
`GET /api/v1/admin/sites` SHALL return pending sites, oldest first, as a paged response. Each
SHALL have the site fields plus the author's display name. It SHALL need role `ADMIN`.

#### Scenario: Pending sites only
- **WHEN** an admin requests the queue and there is one pending and one approved site
- **THEN** only the pending site is returned, with its author's display name

#### Scenario: Not an admin
- **WHEN** a user with role `USER` requests the queue
- **THEN** the response is 403

### Requirement: Admins approve a submission
`POST /api/v1/admin/sites/{id}/approve` SHALL set a pending site to `APPROVED`, which makes it
public, and answer with the site.

#### Scenario: Approved site becomes public
- **WHEN** an admin approves a pending site
- **THEN** the response is 200 with status `APPROVED`
- **AND** the site is in the markers response for an anonymous client

### Requirement: Admins reject a submission with a reason
`POST /api/v1/admin/sites/{id}/reject` SHALL set a pending site to `REJECTED` with the given
reason, of 1 to 500 characters, and answer with the site. The site SHALL stay hidden from others.

#### Scenario: Rejected with a reason
- **WHEN** an admin rejects a pending site with a reason
- **THEN** the response has status `REJECTED` and that reason
- **AND** the site is not in the markers response

#### Scenario: No reason
- **WHEN** an admin rejects a site with a blank reason
- **THEN** the response is 400 with a field error for `reason`, and the site stays pending

### Requirement: Only pending sites can be moderated
Approving or rejecting a site that is not pending SHALL answer 409, and an unknown site 404.
Both endpoints SHALL need role `ADMIN`.

#### Scenario: Already moderated
- **WHEN** an admin approves a site that is already approved or rejected
- **THEN** the response is 409 and the site does not change

#### Scenario: Unknown site
- **WHEN** an admin approves a site that does not exist
- **THEN** the response is 404

#### Scenario: Not an admin
- **WHEN** a user with role `USER` approves a site
- **THEN** the response is 403

### Requirement: The moderation page is for admins
`/admin/moderation` SHALL show admins the queue. Other visitors SHALL see the not-found page, or
the login page when signed out. The account menu SHALL link to it for admins only.

#### Scenario: Signed-in user who is not an admin
- **WHEN** a user with role `USER` opens the page
- **THEN** the not-found page is shown and the queue is not requested

#### Scenario: Account menu
- **WHEN** an admin opens the account menu
- **THEN** it has a link to `/admin/moderation`, and for a user with role `USER` it has none

### Requirement: The moderation page approves and rejects
Each card SHALL show the site's facts, author and a link to its location on OpenStreetMap, with
Approve and Reject actions. Reject SHALL require a reason. A moderated card SHALL leave the queue.

#### Scenario: Approve
- **WHEN** an admin presses Approve on a card
- **THEN** the approve request is sent and the card leaves the queue

#### Scenario: Reject needs a reason
- **WHEN** an admin presses Reject with an empty reason
- **THEN** a field error is shown and nothing is sent

#### Scenario: Reject
- **WHEN** an admin types a reason and presses Reject
- **THEN** the reject request carries the reason and the card leaves the queue

#### Scenario: Empty queue
- **WHEN** the queue is empty
- **THEN** the page shows the empty-queue text of the active language

#### Scenario: Conflict
- **WHEN** the API answers 409 because another admin already acted
- **THEN** the page shows an alert and reloads the queue
