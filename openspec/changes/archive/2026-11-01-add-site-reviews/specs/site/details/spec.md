# Spec Delta

## ADDED Requirements

### Requirement: The facts card shows the community view
The facts card SHALL show the site's rating with its count above the facts, or the no-ratings
text when there are none. Next to the declared difficulty it SHALL show the community difficulty,
the rounded `communityDifficulty` as a difficulty word, or a dash when no review rated it.

#### Scenario: Rated site
- **WHEN** a site has `averageRating` 4.9, `ratingCount` 342 and `communityDifficulty` 3.6
- **THEN** the facts card has a rating labelled "Rated 4.9 out of 5, 342 ratings"
- **AND** the community difficulty reads "Advanced"

#### Scenario: Site without reviews
- **WHEN** a site has `ratingCount` 0 and no `communityDifficulty`
- **THEN** the facts card shows the no-ratings text and a dash for the community difficulty

### Requirement: The site page offers to write or edit a review
An approved site's page SHALL show a "Write a review" button linking to `/sites/{id}/review`.
When the signed-in user has already reviewed the site, the button SHALL read "Edit your review".
An unapproved site SHALL show no such button.

#### Scenario: Visitor without a review
- **WHEN** an anonymous visitor, or a signed-in user who has not reviewed site 7, opens its page
- **THEN** a "Write a review" link targets `/sites/7/review`

#### Scenario: User with a review
- **WHEN** a signed-in user who has reviewed site 7 opens its page
- **THEN** the link reads "Edit your review" and targets `/sites/7/review`

#### Scenario: Pending site
- **WHEN** the author opens their pending site's page
- **THEN** no review link is shown
