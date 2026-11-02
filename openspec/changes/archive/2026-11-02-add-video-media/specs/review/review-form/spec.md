# review/review-form

## ADDED Requirements

### Requirement: The review form offers videos

The review form SHALL include the video field, filled with the review's videos when editing, and send them as `videoIds`.

#### Scenario: Sending

- **WHEN** the user uploads a video and saves the review
- **THEN** the request names the video in `videoIds`

#### Scenario: Editing

- **WHEN** the author opens the form of a review with a video
- **THEN** the field shows that video
