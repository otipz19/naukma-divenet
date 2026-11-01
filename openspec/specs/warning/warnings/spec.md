# warning/warnings Specification

## Purpose

Defines the site-warning API: divers post, read, edit and delete warnings about hazards,
incidents and changed conditions at an approved site, and admins hide warnings.

## Requirements

### Requirement: Signed-in users post a warning to an approved site
`POST /api/v1/sites/{siteId}/warnings` SHALL create a warning by the signed-in user with a
`type` and a `text`. It SHALL respond 201 with the warning and a `Location` header naming
`/api/v1/warnings/{id}`. Unknown and unapproved sites SHALL answer 404.

#### Scenario: Post a warning
- **WHEN** a signed-in user posts type `HAZARD` and a text to an approved site
- **THEN** the response is 201 with the id, the site id, type `HAZARD`, the text, `createdAt` equal to `updatedAt`, and the author's id and display name
- **AND** the `Location` header is `/api/v1/warnings/{id}` of the new warning

#### Scenario: Anonymous client
- **WHEN** a client without an access token posts a warning
- **THEN** the response is 401 and no warning is stored

#### Scenario: Pending site
- **WHEN** the author of a pending site posts a warning to it
- **THEN** the response is a 404 problem detail

#### Scenario: Unknown site
- **WHEN** a signed-in user posts a warning to a site id that does not exist
- **THEN** the response is a 404 problem detail

### Requirement: A warning has a known type and a text
`type` SHALL be one of `HAZARD`, `INCIDENT`, `CHANGED_CONDITIONS` and `MARINE_LIFE`, matched
regardless of letter case. `text` SHALL be required, not blank and at most 1000 characters; it
SHALL be stored without leading and trailing whitespace. Violations SHALL answer 400 with the
field errors.

#### Scenario: Missing type
- **WHEN** a warning is posted without `type`
- **THEN** the response is 400 with a field error on `type` and no warning is stored

#### Scenario: Unknown type
- **WHEN** a warning is posted with type `SHARKNADO`
- **THEN** the response is 400 with a field error on `type`

#### Scenario: Lower-case type
- **WHEN** a warning is posted with type `marine_life`
- **THEN** the response is 201 with type `MARINE_LIFE`

#### Scenario: Blank text
- **WHEN** a warning is posted with text "   "
- **THEN** the response is 400 with a field error on `text`

#### Scenario: Text too long
- **WHEN** a warning is posted with a text of 1001 characters
- **THEN** the response is 400 with a field error on `text`

#### Scenario: Text is trimmed
- **WHEN** a warning is posted with text "  Strong current  "
- **THEN** the stored and returned text is "Strong current"

### Requirement: Everyone reads a site's warnings
`GET /api/v1/sites/{siteId}/warnings` SHALL return the site's visible warnings, newest first,
paged with `page` and `size` as the API conventions define, without an access token. Unknown
and unapproved sites SHALL answer 404.

#### Scenario: Newest first
- **GIVEN** an approved site with warnings posted on 1, 3 and 2 May
- **WHEN** an anonymous client lists the site's warnings
- **THEN** the response is 200 with the warnings of 3, 2 and 1 May in that order and `page.totalElements` 3

#### Scenario: Paging
- **GIVEN** a site with 3 warnings
- **WHEN** a client lists them with `size=2&page=1`
- **THEN** the response holds the oldest warning and `page.totalPages` 2

#### Scenario: Other sites' warnings
- **WHEN** a client lists the warnings of a site
- **THEN** no warning of another site is included

#### Scenario: Unapproved site
- **WHEN** a client lists the warnings of a pending site
- **THEN** the response is a 404 problem detail

### Requirement: Everyone reads one warning
`GET /api/v1/warnings/{id}` SHALL return a visible warning without an access token. Unknown and
hidden warnings SHALL answer 404.

#### Scenario: Read a warning
- **WHEN** an anonymous client reads a visible warning
- **THEN** the response is 200 with the warning

#### Scenario: Unknown warning
- **WHEN** a client reads a warning id that does not exist
- **THEN** the response is a 404 problem detail

### Requirement: Authors edit their warning
`PUT /api/v1/warnings/{id}` SHALL replace the warning's type and text under the same rules as
posting it, set `updatedAt`, keep `createdAt` and return the warning. Only the author SHALL
edit a warning.

#### Scenario: Author edits
- **GIVEN** a warning of type `HAZARD`
- **WHEN** its author puts type `CHANGED_CONDITIONS` and a new text
- **THEN** the response is 200 with the new type and text, the same `createdAt` and a later `updatedAt`

#### Scenario: Another user edits
- **WHEN** a signed-in user who is not the author puts a warning
- **THEN** the response is a 403 problem detail and the warning is unchanged

#### Scenario: Invalid edit
- **WHEN** the author puts a blank text
- **THEN** the response is 400 with a field error on `text` and the warning is unchanged

#### Scenario: Unknown warning
- **WHEN** a signed-in user puts a warning id that does not exist
- **THEN** the response is a 404 problem detail

#### Scenario: Anonymous edit
- **WHEN** a client without an access token puts a warning
- **THEN** the response is 401

### Requirement: Authors delete their warning
`DELETE /api/v1/warnings/{id}` SHALL delete the warning and respond 204. Only the author SHALL
delete a warning.

#### Scenario: Author deletes
- **WHEN** the author deletes their warning
- **THEN** the response is 204 and the site's warnings no longer include it

#### Scenario: Another user deletes
- **WHEN** a signed-in user who is not the author deletes a warning
- **THEN** the response is a 403 problem detail and the warning still exists

#### Scenario: Anonymous delete
- **WHEN** a client without an access token deletes a warning
- **THEN** the response is 401

### Requirement: Admins hide a warning
`POST /api/v1/admin/warnings/{id}/hide` SHALL hide the warning and respond 204; hiding a
hidden warning SHALL also respond 204 and change nothing. Only admins SHALL hide warnings.
Unknown warnings SHALL answer 404.

#### Scenario: Admin hides
- **WHEN** an admin hides a visible warning
- **THEN** the response is 204
- **AND** the site's warnings no longer include it and reading it answers 404

#### Scenario: Hide twice
- **WHEN** an admin hides a warning that is already hidden
- **THEN** the response is 204

#### Scenario: Non-admin hides
- **WHEN** a signed-in user who is not an admin hides a warning
- **THEN** the response is a 403 problem detail and the warning stays visible

#### Scenario: Unknown warning
- **WHEN** an admin hides a warning id that does not exist
- **THEN** the response is a 404 problem detail

### Requirement: A hidden warning is gone for its author
Editing or deleting a hidden warning SHALL answer 404, also for its author.

#### Scenario: Author edits a hidden warning
- **GIVEN** a warning an admin has hidden
- **WHEN** its author puts it
- **THEN** the response is a 404 problem detail

#### Scenario: Author deletes a hidden warning
- **GIVEN** a warning an admin has hidden
- **WHEN** its author deletes it
- **THEN** the response is a 404 problem detail
