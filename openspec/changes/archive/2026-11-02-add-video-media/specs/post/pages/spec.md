# post/pages

## ADDED Requirements

### Requirement: The post page plays its videos

The post page SHALL show a labelled player with controls for each video, after the text and images, loading only metadata until played.

#### Scenario: Post with a video

- **WHEN** a visitor opens a post with a video
- **THEN** the page shows a player whose source is the video's `url`

#### Scenario: Post without a video

- **WHEN** a post has no videos
- **THEN** the page shows no player
