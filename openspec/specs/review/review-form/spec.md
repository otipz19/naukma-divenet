# review/review-form Specification

## Purpose

Defines the page where a signed-in diver writes a review of a site or edits their existing one.

## Requirements

### Requirement: The review form has the design's fields
`/sites/:id/review` SHALL require sign-in and render as in `design/screens/ReviewForm.html`: a
back link to the site, the heading "Write a review" with the site's name and place, a rating
input with "No rating", four difficulty chips, a text area of up to 4000 characters, the photo
field with at most 6 photos, and Cancel and "Publish review" buttons.

#### Scenario: New review form
- **WHEN** a signed-in user who has not reviewed site 7 opens `/sites/7/review`
- **THEN** the page shows the heading "Write a review", the site's name, a link to `/sites/7`
- **AND** "No rating" is selected, no difficulty chip is pressed, and the text and photos are empty

#### Scenario: Anonymous visitor
- **WHEN** an anonymous visitor opens `/sites/7/review`
- **THEN** the app shows the login page, which returns to `/sites/7/review` after sign-in

#### Scenario: Form in Ukrainian
- **WHEN** the active language is `uk`
- **THEN** every label, hint and button is the `uk` text

#### Scenario: Unknown or unapproved site
- **WHEN** the site request answers 404
- **THEN** the page shows the site not-found message and a link to `/`

### Requirement: The form publishes a review
Publishing SHALL send the chosen rating (none for "No rating"), the difficulty of the pressed
chip, the text and the photos' ids, then return to the site page. A difficulty chip SHALL send the
lowest level its word stands for, and pressing the pressed chip SHALL clear it.

#### Scenario: Publish
- **WHEN** the user picks 4 stars, presses "Intermediate", types a text and publishes
- **THEN** the create request has `rating` 4, `difficulty` 2, that text and the photo ids
- **AND** the app navigates to the site page

#### Scenario: No rating
- **WHEN** the user keeps "No rating", types a text and publishes
- **THEN** the create request has no `rating`

### Requirement: The form refuses an empty review
When neither a rating nor a non-blank text is given, the form SHALL not send a request and SHALL
show a message saying a rating or text is needed. A request the server refuses SHALL show an error
alert and keep the user's input.

#### Scenario: Nothing to publish
- **WHEN** the user publishes with "No rating" and an empty text
- **THEN** no request is sent and the form shows the rating-or-text message

#### Scenario: Server error
- **WHEN** the create request answers 400
- **THEN** the form shows an error alert and keeps the values entered

### Requirement: The same form edits the own review
When the user has already reviewed the site, the page SHALL load that review into the form, show
the heading "Edit your review" and the button "Save review", and saving SHALL update that review
instead of creating one.

#### Scenario: Edit loads the review
- **GIVEN** the user's review of site 7 has rating 3, difficulty 4, a text and one photo
- **WHEN** the user opens `/sites/7/review`
- **THEN** 3 stars are selected, "Advanced" is pressed, and the text and the photo are shown

#### Scenario: Save
- **WHEN** the user changes the rating to 5 and saves
- **THEN** an update request for that review is sent with `rating` 5
- **AND** the app navigates to the site page

### Requirement: The review form offers videos

The review form SHALL include the video field, filled with the review's videos when editing, and send them as `videoIds`.

#### Scenario: Sending

- **WHEN** the user uploads a video and saves the review
- **THEN** the request names the video in `videoIds`

#### Scenario: Editing

- **WHEN** the author opens the form of a review with a video
- **THEN** the field shows that video
