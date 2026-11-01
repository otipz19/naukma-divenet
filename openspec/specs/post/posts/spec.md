# post/posts Specification

## Purpose

Writing, validating, reading and listing blog posts through the API (US-12).

## Requirements

### Requirement: A signed-in user writes a post

The API SHALL let a signed-in user create a post through `POST /api/v1/posts` with a title, text, status, and optional cover photo, images, region and site. The author SHALL be the signed-in user.

#### Scenario: Creating a draft

- **WHEN** a signed-in user sends a title and status `DRAFT` with no text
- **THEN** the API answers 201 with the post, its status `DRAFT` and no publication time

#### Scenario: Creating a published post

- **WHEN** a signed-in user sends a title, text and status `PUBLISHED`
- **THEN** the API answers 201 with the post, its status `PUBLISHED` and its publication time

#### Scenario: Anonymous visitor

- **WHEN** a request without a valid token creates a post
- **THEN** the API answers 401

### Requirement: A post is validated

The API SHALL refuse invalid content with a 400 that names the field, and SHALL store nothing. A title SHALL have 1 to 200 characters after stripping. Text SHALL have at most 20000 characters, and a published post SHALL have text. A post SHALL have at most 10 images, and its cover SHALL NOT also be one of its images.

#### Scenario: Blank title

- **WHEN** a post has a blank title
- **THEN** the API answers 400 naming `title`

#### Scenario: Publishing without text

- **WHEN** a post with status `PUBLISHED` has blank text
- **THEN** the API answers 400 naming `text`

#### Scenario: Text too long

- **WHEN** a post has more than 20000 characters of text
- **THEN** the API answers 400 naming `text`

#### Scenario: Too many images

- **WHEN** a post has 11 images
- **THEN** the API answers 400 naming `photoIds`

#### Scenario: Cover repeated as an image

- **WHEN** a post's cover is also in its images
- **THEN** the API answers 400 naming `photoIds`

#### Scenario: Someone else's upload

- **WHEN** a post names an upload by another user as its cover or an image
- **THEN** the API answers 400 naming that field

### Requirement: A post links to a region and a site

A post MAY link to a region, an approved site, or both. A post linked to a site and no region SHALL take the site's region. A region and site that disagree SHALL be refused.

#### Scenario: Site without a region

- **WHEN** a post names an approved site and no region
- **THEN** the post has that site and the site's region

#### Scenario: Region alone

- **WHEN** a post names a region and no site
- **THEN** the post has that region and no site

#### Scenario: Unknown region

- **WHEN** a post names a region that does not exist
- **THEN** the API answers 400 naming `regionCode`

#### Scenario: Unapproved site

- **WHEN** a post names a site that is not approved
- **THEN** the API answers 400 naming `siteId`

#### Scenario: Region and site disagree

- **WHEN** a post names a site in another region than the one it names
- **THEN** the API answers 400 naming `siteId`

### Requirement: Authors edit and delete their posts

The API SHALL let the author replace a post's content and status through `PUT /api/v1/posts/{id}`, and delete it through `DELETE /api/v1/posts/{id}`. The first publication SHALL set the publication time, and later saves SHALL keep it. Images left out or deleted with the post SHALL be released.

#### Scenario: Publishing a draft

- **WHEN** the author saves a draft with status `PUBLISHED`
- **THEN** the post is published with the current time as its publication time

#### Scenario: Moving back to drafts

- **WHEN** the author saves a published post with status `DRAFT`
- **THEN** the post is a draft, and readers no longer see it

#### Scenario: Publishing again

- **WHEN** the author publishes a post that was published before
- **THEN** it keeps its first publication time

#### Scenario: Removing an image

- **WHEN** the author saves a post without one of its images
- **THEN** that upload is released, and the others are kept

#### Scenario: Deleting

- **WHEN** the author deletes a post
- **THEN** the API answers 204, the post answers 404, and its uploads are released

#### Scenario: Not the author

- **WHEN** another user, an admin included, edits or deletes a post
- **THEN** the API answers 403 and the post is unchanged

#### Scenario: Unknown post

- **WHEN** the author edits or deletes a post that does not exist
- **THEN** the API answers 404

### Requirement: Published posts are public and drafts are private

`GET /api/v1/posts/{id}` SHALL answer a published post to anyone, with its author, region, site, cover, images and text. A draft SHALL answer 404 to everyone but its author.

#### Scenario: Reading a published post

- **WHEN** an anonymous visitor reads a published post
- **THEN** the API answers 200 with the post

#### Scenario: Author reads a draft

- **WHEN** the author reads their draft
- **THEN** the API answers 200 with the draft

#### Scenario: Someone else reads a draft

- **WHEN** an anonymous visitor, another user or an admin reads a draft
- **THEN** the API answers 404

### Requirement: A blog and the user's drafts are listed

`GET /api/v1/users/{id}/posts` SHALL answer anyone with a page of that author's published posts, newest publication first. `GET /api/v1/posts/drafts` SHALL answer the signed-in user with a page of their own drafts, latest update first. Each item SHALL carry an excerpt and a reading time, not the whole text, and the query count SHALL NOT grow with the page size.

#### Scenario: Reading a blog

- **WHEN** anyone lists an author who has two published posts and a draft
- **THEN** the page holds the two published posts, newest first, with excerpts and reading times

#### Scenario: Unknown author

- **WHEN** anyone lists the posts of a user who does not exist
- **THEN** the API answers 404

#### Scenario: Own drafts

- **WHEN** a signed-in user lists their drafts
- **THEN** the page holds only their own drafts, latest update first

#### Scenario: Drafts when anonymous

- **WHEN** a request without a valid token lists drafts
- **THEN** the API answers 401

#### Scenario: Query count

- **WHEN** a page of ten posts with covers, regions and sites is listed
- **THEN** it uses the same number of queries as a page of one
