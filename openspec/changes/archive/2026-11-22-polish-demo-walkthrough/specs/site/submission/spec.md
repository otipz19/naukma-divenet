# Spec Delta

## MODIFIED Requirements

### Requirement: The submission page sends a site
The page SHALL offer the site's name, location, country and region, depths, difficulty, gear and
description, and validate them before sending. Clicking its map SHALL set the latitude and longitude.
The difficulty SHALL be offered as the four words Beginner, Intermediate, Advanced and Technical,
without level numbers, and a word SHALL send the lowest level it stands for.

#### Scenario: Map click sets the location
- **WHEN** a user clicks the location map
- **THEN** the latitude and longitude fields hold that point

#### Scenario: Difficulty offered as words
- **WHEN** a user opens the Difficulty field
- **THEN** it offers exactly Beginner, Intermediate, Advanced and Technical in the active language, and no option shows a number

#### Scenario: A word sends its lowest level
- **WHEN** a user picks Beginner, Intermediate, Advanced or Technical and submits an otherwise valid form
- **THEN** the request's `difficulty` is 1, 2, 4 or 5 respectively

#### Scenario: Form errors
- **WHEN** a user submits an empty form
- **THEN** field errors in the active language are shown and nothing is sent

#### Scenario: Successful submission
- **WHEN** a user submits a valid form
- **THEN** the request carries the values, a success message is shown, the form is cleared and the site appears in the user's submissions as pending

#### Scenario: Server field error
- **WHEN** the API answers 400 with a field error for `regionCode`
- **THEN** the page shows an error at that field or, for a field it has no message for, a general error alert
