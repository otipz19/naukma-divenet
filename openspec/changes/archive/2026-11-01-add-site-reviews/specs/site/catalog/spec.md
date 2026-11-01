# Spec Delta

## MODIFIED Requirements

### Requirement: Clients read all sites as map markers
`GET /api/v1/sites/markers` SHALL return every approved site matching its optional filters as an
unpaged array, ordered by name unless `sort=rating` is given, without authentication. With no
filters it SHALL return every approved site. Each marker SHALL have `id`, `name`, `lat`, `lng`,
`countryCode`, `regionCode`, `difficulty`, `minDepth`, `maxDepth`, `ratingCount` and, when the
site has ratings, `averageRating`.

#### Scenario: Anonymous client reads the markers
- **GIVEN** a site named "Blue Hole" at latitude 28.5722 and longitude 34.5375 in the region `eg-dahab`
- **WHEN** a client without an access token requests `GET /api/v1/sites/markers`
- **THEN** the response is 200 with a JSON array
- **AND** the entry for that site has those values, with `countryCode` `EG`

#### Scenario: Markers are ordered by name
- **GIVEN** sites named "Canyon" and "Blue Hole"
- **WHEN** a client requests `GET /api/v1/sites/markers`
- **THEN** "Blue Hole" comes before "Canyon"

#### Scenario: Unapproved sites are hidden
- **GIVEN** a pending site and a rejected site
- **WHEN** a client requests `GET /api/v1/sites/markers`, even as their author or an admin
- **THEN** neither is returned

#### Scenario: Markers carry the rating
- **GIVEN** a site with two reviews rated 4 and 5, and a site without reviews
- **WHEN** a client requests `GET /api/v1/sites/markers`
- **THEN** the first site's marker has `averageRating` 4.5 and `ratingCount` 2
- **AND** the second has no `averageRating` and `ratingCount` 0

### Requirement: Clients read one site's details
`GET /api/v1/sites/{id}` SHALL return the marker fields of the site plus `description`,
`requiredGear`, `recommendedGear`, `status`, `rejectionReason`, `reviewCount` and
`communityDifficulty`, without authentication. The gear fields SHALL be arrays of gear codes,
sorted by code. An unapproved site SHALL be returned only to its author and to admins; for anyone
else the answer SHALL be the same as for an unknown site.

#### Scenario: Anonymous client reads a site
- **GIVEN** a site that requires `torch` and `smb`, and recommends `nitrox`
- **WHEN** a client without an access token requests that site
- **THEN** the response is 200 with its description
- **AND** `requiredGear` is `["smb", "torch"]` and `recommendedGear` is `["nitrox"]`

#### Scenario: Unknown site
- **WHEN** a client requests `GET /api/v1/sites/999999` and no such site exists
- **THEN** the response is a 404 problem detail

#### Scenario: Pending site for others
- **GIVEN** a pending site
- **WHEN** an anonymous client, or a signed-in user who is not its author, requests it
- **THEN** the response is a 404 problem detail

#### Scenario: Pending site for its author and admins
- **GIVEN** a pending site
- **WHEN** its author or an admin requests it
- **THEN** the response is 200 with status `PENDING`

#### Scenario: Site details carry the review aggregates
- **GIVEN** a site with one review rated 4 with difficulty 3
- **WHEN** a client requests that site
- **THEN** the response has `averageRating` 4.0, `ratingCount` 1, `reviewCount` 1 and `communityDifficulty` 3.0
