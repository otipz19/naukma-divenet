# post/editor

## ADDED Requirements

### Requirement: The editor offers videos

The post editor SHALL include the video field, filled with the post's videos when editing, and send them as `videoIds`.

#### Scenario: Sending

- **WHEN** the user uploads a video and saves the post
- **THEN** the request names the video in `videoIds`

#### Scenario: Editing

- **WHEN** the author opens the editor of a post with a video
- **THEN** the field shows that video
