# review/site-reviews Specification

## Purpose

Defines the Reviews section of the site page, where divers read a site's reviews and manage
their own.

## Requirements

### Requirement: The site page lists the site's reviews
An approved site's page SHALL show a "Reviews" section, laid out as in `design/screens/Site.html`,
with the review count and a card per review: the author's display name and initials, the date in
the active language, the rating when one was given, the text and the photo thumbnails. Each
thumbnail SHALL link to its full photo.

#### Scenario: Review card
- **GIVEN** a review by "Oleh Kravets" of 12 May 2026 rated 5 with one photo
- **WHEN** a user opens the site page in `en`
- **THEN** the card shows "Oleh Kravets", "OK", "12 May 2026", a rating labelled "Rated 5 out of 5", the text and a thumbnail linking to the photo's `url`

#### Scenario: Text-only review
- **WHEN** a review has no rating
- **THEN** its card shows no rating

#### Scenario: Date in Ukrainian
- **WHEN** the active language is `uk`
- **THEN** the date is formatted for `uk`

#### Scenario: No reviews
- **WHEN** the site has no reviews
- **THEN** the section shows the no-reviews text of the active language

#### Scenario: Unapproved site
- **WHEN** the author opens their pending site's page
- **THEN** no Reviews section is shown and no reviews request is sent

### Requirement: Reviews can be sorted and loaded in pages
The section SHALL offer a sort select with "Newest first" and "Highest rated", and SHALL load
further pages with a "Load more reviews" button that is shown only while more reviews exist.

#### Scenario: Sort by rating
- **WHEN** a user selects "Highest rated"
- **THEN** the reviews request has `sort=rating` and the list shows its result

#### Scenario: Load more
- **GIVEN** a site with more reviews than one page holds
- **WHEN** a user presses "Load more reviews"
- **THEN** the next page is requested and its reviews are added after the shown ones
- **AND** the button disappears once the last page is shown

### Requirement: The user manages their own review on the site page
The signed-in user's own review SHALL be marked "(you)" and have Edit and Delete buttons. Edit
SHALL open the review form. Delete SHALL ask for confirmation, then delete the review and refresh
the reviews and the site's rating. Other reviews SHALL have no such buttons.

#### Scenario: Own review
- **WHEN** a signed-in user opens a site they reviewed
- **THEN** their review is marked "(you)" and has Edit and Delete buttons, and other reviews have none

#### Scenario: Edit
- **WHEN** the user presses Edit on their review of site 7
- **THEN** the app navigates to `/sites/7/review`

#### Scenario: Delete confirmed
- **WHEN** the user presses Delete and then confirms
- **THEN** a delete request for the review is sent
- **AND** the review list and the site's rating are requested again

#### Scenario: Delete cancelled
- **WHEN** the user presses Delete and then cancels
- **THEN** no delete request is sent and the review is still shown

#### Scenario: Delete fails
- **WHEN** the delete request answers 500
- **THEN** the section shows an error alert and the review is still shown

### Requirement: A review's author links to their profile
Each review card SHALL link the author's name to `/users/{id}` and show their avatar, or their
initials when they have none. A review's `author` in the API SHALL carry `avatarUrl`, the avatar's
thumbnail URL, or null.

#### Scenario: Author with an avatar
- **WHEN** a review's author has an avatar
- **THEN** the card shows the thumbnail, and the name links to the author's profile

#### Scenario: Author without an avatar
- **WHEN** a review's author has no avatar
- **THEN** the card shows the initials, and the name links to the author's profile

#### Scenario: API field
- **WHEN** a client reads the reviews of a site whose author has an avatar
- **THEN** `author.avatarUrl` is that avatar's thumbnail URL
