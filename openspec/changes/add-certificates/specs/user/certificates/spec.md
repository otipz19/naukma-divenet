# Spec Delta

## Purpose

Defines how divers declare their certifications and who may read them, so that others can see a diver's
experience level while the certificate's number and photo stay private.

## ADDED Requirements

### Requirement: A signed-in user declares a certificate
`POST /api/v1/certificates` SHALL create a `PENDING` certificate for the caller with `agency`, `level`, `number` and an optional
`photoId`, and answer 201 with it. It SHALL need an access token.

#### Scenario: Declared
- **WHEN** a signed-in user posts agency `PADI`, a level and a number
- **THEN** the response is 201 with status `PENDING`

#### Scenario: With a photo
- **WHEN** a user posts an upload of theirs as `photoId`
- **THEN** the response carries the photo's URLs

#### Scenario: No access token
- **WHEN** a client without an access token posts a certificate
- **THEN** the response is 401

### Requirement: A certificate is validated
The API SHALL answer 400 with field errors for: an `agency` other than `PADI`, `SSI`, `CMAS` or `OTHER`, a blank `level` or one above 100
characters, a blank `number` or one above 50 characters, and a `photoId` that cannot be attached.

#### Scenario: Unknown agency
- **WHEN** a user posts agency `NASA`
- **THEN** the response is 400 with a field error for `agency`

#### Scenario: Blank number
- **WHEN** a user posts a blank number
- **THEN** the response is 400 with a field error for `number`

#### Scenario: Another user's upload
- **WHEN** a user posts another user's upload
- **THEN** the response is 400 with a field error for `photoId`, and nothing is created

### Requirement: Owners edit and delete their certificates
`PUT /api/v1/certificates/{id}` SHALL replace a certificate and return it to `PENDING`, clearing any rejection reason, because a verification covers
only what was checked. `DELETE` SHALL remove it and answer 204. Changing or deleting it SHALL release a photo no longer used. Another user SHALL get 403, and an
unknown certificate 404.

#### Scenario: Editing a verified certificate
- **WHEN** the owner edits a verified certificate
- **THEN** its status is `PENDING`

#### Scenario: Editing a rejected certificate
- **WHEN** the owner edits a rejected certificate
- **THEN** its status is `PENDING` and `rejectionReason` is null

#### Scenario: Delete
- **WHEN** the owner deletes a certificate with a photo
- **THEN** the response is 204, and the photo's file answers 404

#### Scenario: Replacing the photo
- **WHEN** the owner edits a certificate with a new photo
- **THEN** the previous photo's file answers 404

#### Scenario: Another user
- **WHEN** another user edits or deletes the certificate
- **THEN** the response is 403 and it is unchanged

### Requirement: Certificates are readable within the privacy setting
`GET /api/v1/users/{id}/certificates` SHALL return the diver's certificates, newest first, as an unpaged array. It SHALL answer 403 to everyone but the owner
and admins when `showCertificates` is false, and 404 for an unknown user.

#### Scenario: Public read
- **WHEN** an anonymous client reads a diver with `showCertificates` true
- **THEN** the response has the certificates' agency, level and status

#### Scenario: Hidden
- **WHEN** an anonymous client or another user reads a diver with `showCertificates` false
- **THEN** the response is 403

#### Scenario: Owner and admin of hidden certificates
- **WHEN** the owner or an admin reads them
- **THEN** the response is 200

#### Scenario: Unknown user
- **WHEN** a client reads a user that does not exist
- **THEN** the response is 404

### Requirement: Private details go only to the owner and admins
Only the owner and admins SHALL receive `number`, `photo`, and `rejectionReason`, and only they SHALL see a `REJECTED` certificate.

#### Scenario: Another reader
- **WHEN** another user reads a public diver who has a pending certificate with a number and photo, and a rejected one
- **THEN** only the pending one is returned, with `number` and `photo` null

#### Scenario: Owner
- **WHEN** the owner reads the same diver
- **THEN** both are returned with their details

### Requirement: The certificates page manages the user's certificates
`/profile/certificates` SHALL need a signed-in user. It SHALL list their certificates with their status in the active language and any rejection reason, and offer a form to add
one and to edit or delete each, with deletion confirmed. Editing a verified certificate SHALL warn that it will need verifying again. The profile's owner SHALL have a link to it.

#### Scenario: Signed out
- **WHEN** a signed-out visitor opens the page
- **THEN** the login page is shown

#### Scenario: Listed
- **WHEN** the user has a verified and a rejected certificate
- **THEN** both show their status, and the rejected one its reason

#### Scenario: Added
- **WHEN** the user fills in the form and saves
- **THEN** the request carries the values, and the form is cleared and the list refreshed

#### Scenario: Form errors
- **WHEN** the user saves with no level or number
- **THEN** field errors in the active language are shown and nothing is sent

#### Scenario: Edit warning
- **WHEN** the user edits a verified certificate
- **THEN** the form shows the warning and the update request is sent on save

#### Scenario: Delete
- **WHEN** the user deletes a certificate and confirms
- **THEN** the delete request is sent, and it leaves the list

#### Scenario: Failed save
- **WHEN** the API answers 500
- **THEN** the page shows an alert and keeps the entered values
