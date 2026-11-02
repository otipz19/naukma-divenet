# review/reviews

## ADDED Requirements

### Requirement: A review takes videos

A review's create and edit requests SHALL accept `videoIds`, up to 3 of the author's own videos, and a review SHALL answer with a `videos` list in that order. A video alone SHALL NOT satisfy the rule that a review needs a rating or text. Videos left out of an edit, or on a deleted review, SHALL be released. The query count for a page of reviews SHALL NOT grow with the page size.

#### Scenario: Creating with a video

- **WHEN** an author creates a review with a rating and one of their videos
- **THEN** the review answers with that video's `id`, `url` and `contentType`

#### Scenario: Too many

- **WHEN** a review names 4 videos
- **THEN** the API answers 400 naming `videoIds`

#### Scenario: Someone else's video

- **WHEN** a review names another user's video
- **THEN** the API answers 400 naming `videoIds`

#### Scenario: A video alone

- **WHEN** a review has a video and neither rating nor text
- **THEN** the API answers 400 and nothing is stored

#### Scenario: Removing on edit

- **WHEN** an author edits a review and leaves out one of its videos
- **THEN** that video is released, and the others are kept

#### Scenario: Deleting the review

- **WHEN** an author deletes a review with a video
- **THEN** the video is released

#### Scenario: Query count

- **WHEN** a page of reviews with videos is listed
- **THEN** a longer page uses the same number of queries as a shorter one
