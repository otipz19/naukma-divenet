# Spec Delta

## Purpose

Defines how divers record the dives they have made and who may read them, so that a personal history
can be kept and shared within the owner's privacy settings.

## ADDED Requirements

### Requirement: A signed-in user logs a dive
`POST /api/v1/dive-log` SHALL create an entry for the caller and answer 201 with it. An entry SHALL have
`siteId` and `date`, and may have `maxDepth`, `visibility`, `waterTemperature`, `current`, `buddies` and `notes`.
The answer SHALL also carry the site's name, country code and region code. It SHALL need an access token.

#### Scenario: Only the required fields
- **WHEN** a signed-in user posts an approved site and a date
- **THEN** the response is 201 with the entry, the site's name and null optional fields

#### Scenario: All fields
- **WHEN** a user posts every field, with `maxDepth` 30.4 and `current` `MILD`
- **THEN** the response has those values

#### Scenario: No access token
- **WHEN** a client without an access token posts an entry
- **THEN** the response is 401

### Requirement: An entry is validated
The API SHALL answer 400 with field errors for: a missing or unapproved site, a missing date, a date more than one
day after the server's current UTC date, a `maxDepth` outside 0 to 400, a `visibility` outside 0 to 200, a
`waterTemperature` outside -5 to 40, a `current` other than `NONE`, `MILD`, `MODERATE` or `STRONG`, `buddies`
above 200 characters, and `notes` above 2000 characters.

#### Scenario: Pending site
- **WHEN** a user posts a site that is not approved
- **THEN** the response is 400 with a field error for `siteId`

#### Scenario: Date in the future
- **WHEN** a user posts a date two days after the current UTC date
- **THEN** the response is 400 with a field error for `date`

#### Scenario: Tomorrow in UTC
- **WHEN** a user whose local date is ahead of UTC posts a date one day after the current UTC date
- **THEN** the entry is created

#### Scenario: Values out of range
- **WHEN** a user posts a `maxDepth` of 401, and then a `current` of `WILD`
- **THEN** each response is 400 with a field error for that field

### Requirement: Authors edit and delete their own entries
`PUT /api/v1/dive-log/{id}` SHALL replace an entry under the same rules, and `DELETE /api/v1/dive-log/{id}` SHALL remove it
and answer 204. Another user SHALL get 403, and an unknown entry 404.

#### Scenario: Edit
- **WHEN** the author puts new values
- **THEN** the response has those values

#### Scenario: Delete
- **WHEN** the author deletes an entry
- **THEN** the response is 204 and the entry is gone from the log

#### Scenario: Another user
- **WHEN** another user edits or deletes the entry
- **THEN** the response is 403 and the entry is unchanged

#### Scenario: Unknown entry
- **WHEN** a user edits an entry that does not exist
- **THEN** the response is 404

### Requirement: A diver's log is readable within their privacy settings
`GET /api/v1/users/{id}/dive-log` SHALL return the diver's entries as a paged response, newest dive first.
`GET /api/v1/users/{id}/visited-sites` SHALL return each site they have logged with its number of dives, as an unpaged
array ordered by site name. Both SHALL answer 403 to everyone but the owner when `showDiveLog` is false, and 404 for an
unknown user.

#### Scenario: Public log
- **WHEN** an anonymous client reads the log of a diver with `showDiveLog` true
- **THEN** the response has the entries, newest dive first

#### Scenario: Hidden log
- **WHEN** an anonymous client or another user reads the log or visited sites of a diver with `showDiveLog` false
- **THEN** the response is 403

#### Scenario: Owner of a hidden log
- **WHEN** the owner reads their own log with `showDiveLog` false
- **THEN** the response is 200 with the entries

#### Scenario: Visited sites
- **WHEN** a diver has two dives at one site and one at another
- **THEN** the visited sites list both, with 2 and 1 dives

#### Scenario: Unknown user
- **WHEN** a client reads the log of a user that does not exist
- **THEN** the response is 404

### Requirement: Buddies and notes are private to the owner
Only the owner SHALL receive `buddies` and `notes`, because they may name other people. For anyone else, both SHALL be null.

#### Scenario: Another reader
- **WHEN** another user reads a public log whose entry has buddies and notes
- **THEN** both are null, and the other fields are present

#### Scenario: Owner
- **WHEN** the owner reads the same log
- **THEN** both are present

### Requirement: Statistics are readable within the privacy settings
`GET /api/v1/users/{id}/dive-stats` SHALL return `dives`, `sites` and `deepest`, the largest max depth or null. It SHALL answer
403 to everyone but the owner when `showStatistics` is false, and 404 for an unknown user.

#### Scenario: Statistics
- **WHEN** a diver has three dives at two sites, with max depths 10, 30.4 and none
- **THEN** the response is `dives` 3, `sites` 2, `deepest` 30.4

#### Scenario: No dives
- **WHEN** a diver has no dives
- **THEN** the response is `dives` 0, `sites` 0, `deepest` null

#### Scenario: Hidden statistics
- **WHEN** another user reads the statistics of a diver with `showStatistics` false
- **THEN** the response is 403, and the owner still gets 200
