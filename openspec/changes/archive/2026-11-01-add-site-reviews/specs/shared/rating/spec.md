# Spec Delta

## Purpose

Gives every page one Rating component, as specified in `design/system/components/Rating`, to
show a site's or a review's rating and to set a review's rating.

## ADDED Requirements

### Requirement: The rating display shows stars, the value and the count
The display SHALL show five decorative stars with the rounded value filled, the exact value with
one decimal, and the count in parentheses when one is given. It SHALL be one image for assistive
technology, labelled in the active language with the value and, when given, the count.

#### Scenario: Site rating
- **WHEN** the display renders the value 4.6 with the count 128 in `en`
- **THEN** it shows "4.6" and "(128)" with 5 stars filled
- **AND** it has the role `img` and the label "Rated 4.6 out of 5, 128 ratings"

#### Scenario: Review rating
- **WHEN** the display renders the value 5 without a count
- **THEN** it shows "5.0" and its label is "Rated 5 out of 5"

#### Scenario: No ratings yet
- **WHEN** the display renders no value
- **THEN** it shows "No ratings yet" in place of the stars

#### Scenario: Ukrainian label
- **WHEN** the active language is `uk`
- **THEN** the label and the no-ratings text are the `uk` text

### Requirement: The rating input picks 1 to 5 stars or no rating
The input SHALL be a group of radio buttons labelled "1 star" to "5 stars" plus "No rating", and
SHALL report the chosen value, or none for "No rating", to its form.

#### Scenario: Pick 4 stars
- **WHEN** the user selects "4 stars"
- **THEN** the form receives 4 and the stars up to the fourth are shown filled

#### Scenario: Back to no rating
- **WHEN** the user selects "No rating" after picking 4 stars
- **THEN** the form receives no value
