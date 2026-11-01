# review/ratings Specification

## Purpose

Defines how a site's average rating, rating count, review count and community difficulty
follow the reviews written about it.

## Requirements

### Requirement: A site's aggregates follow its reviews
A site's `averageRating` SHALL be the mean of its reviews' ratings, rounded to one decimal, and
`ratingCount` the number of reviews with a rating. `reviewCount` SHALL be the number of its
reviews. `communityDifficulty` SHALL be the mean of its reviews' difficulty ratings, rounded to
one decimal. A mean with no values SHALL be absent.

#### Scenario: Ratings averaged
- **GIVEN** a site with reviews rated 5, 4 and 4, and one text-only review
- **WHEN** a client requests the site
- **THEN** `averageRating` is 4.3, `ratingCount` is 3 and `reviewCount` is 4

#### Scenario: Community difficulty
- **GIVEN** a site with reviews whose difficulty ratings are 2 and 5, and one without
- **WHEN** a client requests the site
- **THEN** `communityDifficulty` is 3.5

#### Scenario: No reviews
- **WHEN** a client requests a site without reviews
- **THEN** `averageRating` and `communityDifficulty` are absent, and `ratingCount` and `reviewCount` are 0

### Requirement: Aggregates change with every review write
Creating, editing or deleting a review SHALL update its site's aggregates before the response
is sent, so the next read of the site or the markers reflects the change.

#### Scenario: Edit changes the average
- **GIVEN** a site whose only review is rated 2
- **WHEN** its author edits the rating to 5 and a client then requests the markers
- **THEN** the site's marker has `averageRating` 5.0

#### Scenario: Delete removes the rating
- **GIVEN** a site whose only review is rated 4
- **WHEN** its author deletes it and a client then requests the site
- **THEN** `averageRating` is absent and `ratingCount` is 0

#### Scenario: Concurrent reviews
- **WHEN** ten users post a rated review to the same site at the same time
- **THEN** the site's `ratingCount` is 10
