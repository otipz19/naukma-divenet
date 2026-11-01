# review/reviews Specification

## Purpose

Defines the review API: signed-in divers write one review per approved site, with a rating,
a difficulty rating, text and photos, and everyone reads a site's reviews.

## Requirements

### Requirement: Signed-in users review an approved site
`POST /api/v1/sites/{siteId}/reviews` SHALL create a review by the signed-in user with the
optional fields `rating` (1–5), `difficulty` (1–5), `text` (up to 4000 characters) and
`photoIds`. It SHALL respond 201 with the review and a `Location` header naming
`/api/v1/reviews/{id}`. Unknown and unapproved sites SHALL answer 404.

#### Scenario: Review with every field
- **WHEN** a signed-in user posts rating 4, difficulty 3, a text and one of their uploads to an approved site
- **THEN** the response is 201 with those values, the photo's `url` and `thumbnailUrl`, and the author's id and display name
- **AND** the `Location` header is `/api/v1/reviews/{id}` of the new review

#### Scenario: Anonymous client
- **WHEN** a client without an access token posts a review
- **THEN** the response is 401 and no review is stored

#### Scenario: Pending site
- **WHEN** the author of a pending site posts a review to it
- **THEN** the response is a 404 problem detail

#### Scenario: Unknown site
- **WHEN** a signed-in user posts a review to a site id that does not exist
- **THEN** the response is a 404 problem detail

### Requirement: A review has a rating or text
A review SHALL have a rating, a text that is not blank, or both. Text SHALL be stored without
leading and trailing whitespace, and blank text SHALL be stored as no text. Out-of-range values
SHALL be refused.

#### Scenario: Rating only
- **WHEN** a signed-in user posts a review with rating 5 and no text
- **THEN** the response is 201 with `text` absent

#### Scenario: Text only
- **WHEN** a signed-in user posts a review with the text "  Calm in the morning. " and no rating
- **THEN** the response is 201 with `text` "Calm in the morning." and `rating` absent

#### Scenario: Neither rating nor text
- **WHEN** a signed-in user posts a review with difficulty 2, blank text and no rating
- **THEN** the response is 400 with a problem detail whose `errors` names `text`

#### Scenario: Out of range
- **WHEN** a signed-in user posts a review with rating 6, or difficulty 0, or a text of 4001 characters
- **THEN** the response is 400 with a problem detail whose `errors` names that field

### Requirement: A user reviews a site once
Each user SHALL have at most one review per site. A second review of the same site by the same
user SHALL be refused with 409.

#### Scenario: Second review
- **GIVEN** a user who has reviewed a site
- **WHEN** that user posts another review to the same site
- **THEN** the response is a 409 problem detail and the first review is unchanged

#### Scenario: Different users
- **WHEN** two users each post a review to the same site
- **THEN** both responses are 201

### Requirement: Reviews carry the author's photos
A review SHALL hold at most 6 photos, in the order given. Each photo SHALL be an upload of the
review's author that is not attached to other content; otherwise the request SHALL be refused
with 400 naming `photoIds`, and nothing SHALL change.

#### Scenario: Too many photos
- **WHEN** a signed-in user posts a review with 7 photo ids
- **THEN** the response is 400 with a problem detail whose `errors` names `photoIds`

#### Scenario: Another user's upload
- **WHEN** a signed-in user posts a review with an upload of another user
- **THEN** the response is 400 with a problem detail whose `errors` names `photoIds`
- **AND** no review is stored and the upload stays unattached

#### Scenario: Photos keep their order
- **WHEN** a signed-in user posts a review with uploads B and A, in that order
- **THEN** the review's `photos` are B and then A

### Requirement: Everyone reads a site's reviews
`GET /api/v1/sites/{siteId}/reviews` SHALL return the reviews of an approved site as a page,
without authentication. `sort=newest` (the default) SHALL order them by creation time, newest
first; `sort=rating` SHALL order them by rating, highest first, reviews without a rating last,
and ties newest first.

#### Scenario: Newest first
- **GIVEN** a site with reviews written on 1 May and 3 May
- **WHEN** an anonymous client requests the site's reviews
- **THEN** the response is a page whose `content` holds the 3 May review first

#### Scenario: Highest rated first
- **GIVEN** a site with reviews rated 3, 5 and none
- **WHEN** a client requests the site's reviews with `sort=rating`
- **THEN** the reviews come in the order 5, 3, none

#### Scenario: Paged
- **GIVEN** a site with 3 reviews
- **WHEN** a client requests them with `size=2`
- **THEN** `content` holds 2 reviews and `page.totalElements` is 3

#### Scenario: Unapproved site
- **WHEN** a client requests the reviews of a pending site, or of an unknown site
- **THEN** the response is a 404 problem detail

#### Scenario: Unknown sort
- **WHEN** a client requests a site's reviews with `sort=oldest`
- **THEN** the response is a 400 problem detail

### Requirement: Users read their own review of a site
`GET /api/v1/sites/{siteId}/reviews/mine` SHALL return the signed-in user's review of that
site, or 404 when they have none.

#### Scenario: Own review exists
- **GIVEN** a user who has reviewed a site
- **WHEN** that user requests the site's `reviews/mine`
- **THEN** the response is 200 with that review

#### Scenario: No own review
- **WHEN** a signed-in user who has not reviewed a site requests its `reviews/mine`
- **THEN** the response is a 404 problem detail

#### Scenario: Anonymous
- **WHEN** a client without an access token requests `reviews/mine`
- **THEN** the response is 401

### Requirement: Authors edit their review
`PUT /api/v1/reviews/{id}` SHALL replace the review's rating, difficulty, text and photos with
the request's, under the same rules as creating it, and return the review. Photos left out SHALL
be deleted; new ones SHALL be attached. Only the author SHALL edit a review.

#### Scenario: Author edits
- **GIVEN** a review with rating 3 and photos A and B
- **WHEN** its author puts rating 4 and photos B and C
- **THEN** the response is 200 with rating 4 and photos B and C
- **AND** `GET /media/{A}` answers 404

#### Scenario: Another user edits
- **WHEN** a signed-in user who is not the author puts a review
- **THEN** the response is a 403 problem detail and the review is unchanged

#### Scenario: Unknown review
- **WHEN** a signed-in user puts a review id that does not exist
- **THEN** the response is a 404 problem detail

### Requirement: Authors delete their review
`DELETE /api/v1/reviews/{id}` SHALL delete the review and its photos and respond 204. Only the
author SHALL delete a review.

#### Scenario: Author deletes
- **GIVEN** a review with one photo
- **WHEN** its author deletes it
- **THEN** the response is 204
- **AND** the site's reviews no longer include it and the photo's `url` answers 404

#### Scenario: Another user deletes
- **WHEN** a signed-in user who is not the author deletes a review
- **THEN** the response is a 403 problem detail and the review still exists

#### Scenario: Anonymous delete
- **WHEN** a client without an access token deletes a review
- **THEN** the response is 401
