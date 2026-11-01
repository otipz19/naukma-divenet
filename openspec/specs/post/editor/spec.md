# post/editor Specification

## Purpose

The page where an author writes, publishes and deletes a post (US-12).

## Requirements

### Requirement: The editor writes a post

The app SHALL show the editor at `/posts/new` and `/posts/:id/edit` to signed-in users, with a title, cover photo, text, images, region and site, in both languages.

#### Scenario: Signed-out visitor

- **WHEN** a signed-out visitor opens `/posts/new`
- **THEN** the app shows the login page

#### Scenario: Editing fills the form

- **WHEN** the author opens the editor of their post
- **THEN** the form holds the post's title, text, cover, images, region and site

#### Scenario: Someone else's post

- **WHEN** a user opens the editor of a post that is not theirs
- **THEN** the app shows a not-found message and no form

### Requirement: The editor saves a draft or publishes

The editor SHALL offer Publish and Save draft for a draft, and Save changes and Move to drafts for a published post. It SHALL check the form as the API does, translate its messages, and keep the values when saving fails.

#### Scenario: Saving a new draft

- **WHEN** the user enters a title and chooses Save draft
- **THEN** the draft is created, and the editor of that draft opens with a saved message

#### Scenario: Publishing

- **WHEN** the user enters a title and text and chooses Publish
- **THEN** the post is published, and its post page opens

#### Scenario: Moving to drafts

- **WHEN** the author of a published post chooses Move to drafts
- **THEN** the post is saved as a draft, and the editor shows the Publish action

#### Scenario: Missing title

- **WHEN** the user chooses Save draft with no title
- **THEN** the editor shows a translated error and sends nothing

#### Scenario: Publishing without text

- **WHEN** the user chooses Publish with no text
- **THEN** the editor shows a translated error on the text and sends nothing

#### Scenario: Saving fails

- **WHEN** the server refuses or fails to save
- **THEN** the editor shows an alert and keeps the values

### Requirement: The editor links a region and a site

The editor SHALL offer a region select and an approved-site search. Choosing a site SHALL set the region to the site's region. Choosing another region SHALL clear a site outside it.

#### Scenario: Choosing a site

- **WHEN** the user picks a site
- **THEN** the region select shows the site's region

#### Scenario: Changing the region

- **WHEN** a site is chosen and the user selects another region
- **THEN** the site is cleared

### Requirement: The editor deletes a post after confirmation

The editor of a saved post SHALL offer Delete post, which asks for confirmation.

#### Scenario: Confirmed delete

- **WHEN** the author chooses Delete post and confirms
- **THEN** the post is deleted, and the author's profile opens

#### Scenario: Declined delete

- **WHEN** the author chooses Delete post and declines
- **THEN** no request is sent and the form is kept

### Requirement: The editor explains the site link

The site field SHALL carry a translated hint saying that the link is optional and that the post appears on the site page.

#### Scenario: Site hint

- **WHEN** the user opens the editor
- **THEN** the site field shows the hint in the active language
