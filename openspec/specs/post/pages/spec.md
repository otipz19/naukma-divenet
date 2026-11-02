# post/pages Specification

## Purpose

The page where anyone reads a published post, and an author reaches its editor (US-12).

## Requirements

### Requirement: The post page shows a post

The app SHALL show a post at `/posts/:id` with its title, cover, author link, publication date, reading time, region, site link, text in paragraphs, and images. Text SHALL be shown as plain text, never as markup.

#### Scenario: Reading a post

- **WHEN** a visitor opens a published post
- **THEN** the page shows its title, author link, date, region, site link, paragraphs and images

#### Scenario: Region in the active language

- **WHEN** a visitor reads in `uk` a post linked to a region
- **THEN** the region shows its Ukrainian name

#### Scenario: Markup in the text

- **WHEN** a post's text contains an HTML tag
- **THEN** the tag shows as text and no element is created

#### Scenario: Unknown or hidden post

- **WHEN** a visitor opens a post that answers 404
- **THEN** the page shows a not-found message

### Requirement: The author reaches the editor from the post page

The post page SHALL show an Edit link to the post's author only, and a Draft badge on a draft.

#### Scenario: Author

- **WHEN** the author opens their post
- **THEN** the page shows an Edit link to its editor

#### Scenario: Other visitor

- **WHEN** another visitor opens the post
- **THEN** the page shows no Edit link

#### Scenario: Draft

- **WHEN** the author opens their draft
- **THEN** the page shows a Draft badge

### Requirement: The post page plays its videos

The post page SHALL show a labelled player with controls for each video, after the text and images, loading only metadata until played.

#### Scenario: Post with a video

- **WHEN** a visitor opens a post with a video
- **THEN** the page shows a player whose source is the video's `url`

#### Scenario: Post without a video

- **WHEN** a post has no videos
- **THEN** the page shows no player
