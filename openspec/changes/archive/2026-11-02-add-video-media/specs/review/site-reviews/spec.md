# review/site-reviews

## ADDED Requirements

### Requirement: A review card plays its videos

A review card SHALL show a labelled player with controls for each video, loading only metadata until played.

#### Scenario: Review with a video

- **WHEN** a visitor opens a site with a review that has a video
- **THEN** the card shows a player whose source is the video's `url`, and its file is not loaded in full until played

#### Scenario: Review without a video

- **WHEN** a review has no videos
- **THEN** the card shows no player
