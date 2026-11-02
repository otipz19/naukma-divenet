# post/posts

## ADDED Requirements

### Requirement: A post takes videos

A post's create and edit requests SHALL accept `videoIds`, up to 3 of the author's own videos, and reading a post SHALL answer with a `videos` list in that order. Lists of posts SHALL NOT carry videos. Videos left out of an edit, or on a deleted post, SHALL be released.

#### Scenario: Creating with a video

- **WHEN** an author creates a post with one of their videos
- **THEN** the post answers with that video's `id`, `url` and `contentType`

#### Scenario: Too many

- **WHEN** a post names 4 videos
- **THEN** the API answers 400 naming `videoIds`

#### Scenario: Someone else's video

- **WHEN** a post names another user's video
- **THEN** the API answers 400 naming `videoIds`

#### Scenario: Removing on edit

- **WHEN** an author edits a post and leaves out one of its videos
- **THEN** that video is released, and the others are kept

#### Scenario: Deleting the post

- **WHEN** an author deletes a post with a video
- **THEN** the video is released

#### Scenario: Lists

- **WHEN** posts are listed in a feed or a blog
- **THEN** the items have no `videos`
