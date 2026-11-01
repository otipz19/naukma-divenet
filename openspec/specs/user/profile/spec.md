# user/profile Specification

## Purpose

Defines a diver's public profile, how its owner edits it, and the privacy settings that later
profile content must respect.

## Requirements

### Requirement: Anyone can read a profile
`GET /api/v1/users/{id}` SHALL return `id`, `displayName`, `bio`, `avatar`, `showDiveLog`,
`showStatistics` and `showCertificates`, without authentication. `avatar` SHALL hold `id`, `url`,
`thumbnailUrl`, `width` and `height`, or be null. The response SHALL NOT contain the email, role or password hash.

#### Scenario: Anonymous read
- **GIVEN** a user with a bio and an avatar
- **WHEN** a client without an access token requests that user
- **THEN** the response is 200 with the display name, bio, avatar URLs and privacy settings
- **AND** the body has no `email`, `role` or `passwordHash`

#### Scenario: New account
- **WHEN** a client requests a user who has never edited their profile
- **THEN** `bio` and `avatar` are null, and all three privacy settings are true

#### Scenario: Unknown user
- **WHEN** a client requests a user that does not exist
- **THEN** the response is a 404 problem detail

### Requirement: Users edit their own profile
`PUT /api/v1/users/me` SHALL replace the caller's bio, avatar and privacy settings, and answer with
the profile. It SHALL need an access token. A blank bio SHALL be stored as null.

#### Scenario: Valid edit
- **WHEN** a signed-in user puts a bio, an avatar they uploaded and `showDiveLog` false
- **THEN** the response is 200 with those values, and `GET /api/v1/users/{id}` returns them

#### Scenario: Blank bio
- **WHEN** a user puts a bio of only spaces
- **THEN** `bio` is null

#### Scenario: No access token
- **WHEN** a client without an access token puts a profile
- **THEN** the response is 401

#### Scenario: Bio too long
- **WHEN** a user puts a bio above 500 characters
- **THEN** the response is 400 with a field error for `bio`

#### Scenario: Missing setting
- **WHEN** a user puts a profile without `showCertificates`
- **THEN** the response is 400 with a field error for `showCertificates`

### Requirement: The avatar follows the media rules
Setting a new avatar SHALL attach the upload and release the previous avatar. Keeping the same avatar
SHALL change nothing, and a null avatar SHALL release the current one. An upload that cannot be attached
SHALL be refused and leave the profile unchanged.

#### Scenario: Replacing the avatar
- **WHEN** a user with an avatar puts a different upload of theirs
- **THEN** the new avatar is shown and the previous one's file answers 404

#### Scenario: Keeping the avatar
- **WHEN** a user puts the avatar they already have
- **THEN** the response is 200 and its file is still served

#### Scenario: Removing the avatar
- **WHEN** a user with an avatar puts a null avatar
- **THEN** `avatar` is null and the previous file answers 404

#### Scenario: Another user's upload
- **WHEN** a user puts an upload of another user
- **THEN** the response is 400 with a field error for `avatarId`, and the profile is unchanged

### Requirement: The profile page shows the diver
`/users/:id` SHALL show the display name as the level-one heading, the avatar or initials, and the
bio. An unknown id SHALL show a not-found message with a link to `/`, and any other failed load an alert.

#### Scenario: Profile renders
- **WHEN** a visitor opens the page of a user with an avatar and a bio
- **THEN** the page shows the name, avatar image and bio

#### Scenario: No avatar or bio
- **WHEN** a visitor opens the page of a user with neither
- **THEN** the page shows the name and initials, and no empty bio

#### Scenario: Unknown user
- **WHEN** the API answers 404
- **THEN** the page shows the not-found message and a link whose target is `/`

#### Scenario: API error
- **WHEN** the API answers 500
- **THEN** the page shows an alert with the error text of the active language

### Requirement: Owners reach their edit page
The profile page SHALL show an edit link to its owner only. The account menu and the drawer SHALL link
to the signed-in user's profile.

#### Scenario: Owner
- **WHEN** a signed-in user opens their own profile
- **THEN** a link to `/profile/edit` is shown

#### Scenario: Other visitor
- **WHEN** another user or an anonymous visitor opens it
- **THEN** no edit link is shown

#### Scenario: Account menu
- **WHEN** a signed-in user opens the account menu
- **THEN** it has a link to `/users/{id}` for that user

### Requirement: The edit page saves the profile
`/profile/edit` SHALL need a signed-in user. It SHALL show the current bio, avatar and privacy settings,
validate the bio before sending, and return to the profile after saving.

#### Scenario: Signed out
- **WHEN** a signed-out visitor opens `/profile/edit`
- **THEN** the login page is shown

#### Scenario: Saved
- **WHEN** a user changes the bio and a privacy setting and saves
- **THEN** the request carries the new values and the current avatar, and the profile page is shown

#### Scenario: Bio too long
- **WHEN** a user enters a bio above 500 characters and saves
- **THEN** a field error in the active language is shown and nothing is sent

#### Scenario: Failed save
- **WHEN** the API answers 500
- **THEN** the page shows an alert and keeps the entered values

### Requirement: The profile page shows dive statistics
The profile page SHALL show the diver's dives, sites and deepest dive, unless `showStatistics` is false and the visitor is not the owner.

#### Scenario: Statistics shown
- **WHEN** a visitor opens a profile with `showStatistics` true
- **THEN** the page shows the three numbers

#### Scenario: Statistics hidden
- **WHEN** another visitor opens a profile with `showStatistics` false
- **THEN** the statistics are not requested or shown

### Requirement: The profile page shows the dive history and visited sites
The profile page SHALL show the diver's visited sites with their dive counts, and their dives without buddies or notes, with more
loading on request. For another visitor when `showDiveLog` is false, it SHALL show a notice instead, and SHALL NOT request them.

#### Scenario: History shown
- **WHEN** a visitor opens a profile with `showDiveLog` true
- **THEN** the page shows visited sites linking to their pages, and the dives

#### Scenario: History hidden
- **WHEN** another visitor opens a profile with `showDiveLog` false
- **THEN** the page shows the hidden-history notice of the active language, and neither request is made

#### Scenario: Owner of a hidden history
- **WHEN** the owner opens their profile with `showDiveLog` false
- **THEN** the page shows their history

#### Scenario: No dives
- **WHEN** a diver has no dives
- **THEN** the page shows the no-dives text of the active language
