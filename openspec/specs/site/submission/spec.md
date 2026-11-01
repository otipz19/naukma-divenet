# site/submission Specification

## Purpose

Defines how signed-in divers add new dive sites and follow them through moderation, while
a submission stays hidden from everyone else.

## Requirements

### Requirement: A signed-in user submits a site
`POST /api/v1/sites` SHALL create a site with status `PENDING` and the caller as its author,
and answer 201 with the site. It SHALL need an access token.

#### Scenario: Valid submission
- **WHEN** a signed-in user posts a valid site with `requiredGear` `["torch"]`
- **THEN** the response is 201 with status `PENDING` and that gear

#### Scenario: No access token
- **WHEN** a client without an access token posts a site
- **THEN** the response is 401

### Requirement: A submission is validated
The endpoint SHALL answer 400 with field errors for: a blank name or description, a name above
120 characters, a description above 5000 characters, a latitude outside -90 to 90, a longitude
outside -180 to 180, a difficulty outside 1 to 5, a negative depth or one above 400, a minimum depth
above the maximum, an unknown region or gear code, and a gear code listed as both required and recommended.

#### Scenario: Out-of-range coordinates
- **WHEN** a user posts a site with latitude 91
- **THEN** the response is 400 with a field error for `lat`
- **AND** no site is created

#### Scenario: Depths in the wrong order
- **WHEN** a user posts a site with a minimum depth of 30 and a maximum of 10
- **THEN** the response is 400 with a field error for `minDepth`

#### Scenario: Unknown codes
- **WHEN** a user posts a site with an unknown region and an unknown gear code
- **THEN** the response is 400 with field errors for `regionCode` and `requiredGear`

#### Scenario: Gear listed twice
- **WHEN** a user posts a site with `torch` both required and recommended
- **THEN** the response is 400 with a field error for `recommendedGear`

### Requirement: Authors see their own submissions
`GET /api/v1/sites/mine` SHALL return the caller's submissions, newest first, each with
`id`, `name`, `status` and `rejectionReason`, as an unpaged array. It SHALL need an access token.

#### Scenario: Own submissions only
- **WHEN** two users have each submitted a site and one requests `/mine`
- **THEN** only that user's site is returned

#### Scenario: Rejection reason
- **WHEN** an author's site was rejected with a reason
- **THEN** `/mine` shows status `REJECTED` and that reason

#### Scenario: No access token
- **WHEN** a client without an access token requests `/mine`
- **THEN** the response is 401

### Requirement: The submission page needs a signed-in user
`/sites/new` SHALL redirect a signed-out visitor to the login page, which returns to it after
login. The map page SHALL link to it.

#### Scenario: Signed out
- **WHEN** a signed-out visitor opens `/sites/new`
- **THEN** the login page is shown, and logging in returns to `/sites/new`

#### Scenario: Link from the map
- **WHEN** a visitor opens `/`
- **THEN** a link to `/sites/new` is shown

### Requirement: The submission page sends a site
The page SHALL offer the site's name, location, country and region, depths, difficulty, gear and
description, and validate them before sending. Clicking its map SHALL set the latitude and longitude.

#### Scenario: Map click sets the location
- **WHEN** a user clicks the location map
- **THEN** the latitude and longitude fields hold that point

#### Scenario: Form errors
- **WHEN** a user submits an empty form
- **THEN** field errors in the active language are shown and nothing is sent

#### Scenario: Successful submission
- **WHEN** a user submits a valid form
- **THEN** the request carries the values, a success message is shown, the form is cleared and the site appears in the user's submissions as pending

#### Scenario: Server field error
- **WHEN** the API answers 400 with a field error for `regionCode`
- **THEN** the page shows an error at that field or, for a field it has no message for, a general error alert

### Requirement: The submission page lists the user's submissions
The page SHALL list the user's submissions with a status badge in the active language and any
rejection reason. Each name SHALL link to the site's page.

#### Scenario: Statuses shown
- **WHEN** the user has one pending and one rejected submission
- **THEN** both show their status, and the rejected one shows its reason
