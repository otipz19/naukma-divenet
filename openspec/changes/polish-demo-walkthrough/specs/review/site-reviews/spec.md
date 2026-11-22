# Spec Delta

## MODIFIED Requirements

### Requirement: The site page lists the site's reviews
An approved site's page SHALL show a "Reviews" section, laid out as in `design/screens/Site.html`,
with the review count and a card per review: the author's display name and initials, the date in
the active language, the rating when one was given, the text and the photo thumbnails. Each
thumbnail SHALL link to its full photo, and clicking it SHALL open the photo in the photo viewer.

#### Scenario: Review card
- **GIVEN** a review by "Oleh Kravets" of 12 May 2026 rated 5 with one photo
- **WHEN** a user opens the site page in `en`
- **THEN** the card shows "Oleh Kravets", "OK", "12 May 2026", a rating labelled "Rated 5 out of 5", the text and a thumbnail linking to the photo's `url`

#### Scenario: Photo opens in the viewer
- **WHEN** a user clicks a review's photo thumbnail
- **THEN** the photo viewer opens over the site page showing that photo, and the site page stays open

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
