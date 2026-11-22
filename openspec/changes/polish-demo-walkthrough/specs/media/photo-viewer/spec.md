# Spec Delta

## Purpose

Lets a user look at a full-size photo inside the app: review photos, post images and
certificate photos open in an overlay viewer over the current page instead of as a bare
image file.

## ADDED Requirements

### Requirement: A photo opens in an overlay viewer
Clicking a photo thumbnail SHALL open an overlay viewer over the current page. The viewer
SHALL show that photo at full size and keep the page's URL. Each thumbnail SHALL stay a
link to its photo's `url`, so opening it in a new tab still works.

#### Scenario: Opening a photo
- **WHEN** a user clicks the second photo of a review with three photos
- **THEN** a viewer opens over the page showing that photo's `url`
- **AND** the page's URL does not change

#### Scenario: Thumbnail stays a link
- **WHEN** a review card with a photo is shown
- **THEN** its thumbnail is a link whose target is the photo's `url`

### Requirement: The viewer moves between the photos of one item
The viewer SHALL offer previous and next among the photos of the same review, post or
certificate, by buttons and by the left and right arrow keys. With one photo it SHALL
offer neither.

#### Scenario: Next photo
- **WHEN** the viewer shows the first of three photos and the user presses Next
- **THEN** it shows the second photo

#### Scenario: Arrow keys
- **WHEN** the viewer shows the second of three photos and the user presses the left arrow key
- **THEN** it shows the first photo

#### Scenario: Single photo
- **WHEN** the viewer shows an item's only photo
- **THEN** no previous or next button is shown

### Requirement: The viewer closes and returns focus
The viewer SHALL close on its close button and on Escape. When it closes, focus SHALL
return to the thumbnail that opened it. Its buttons SHALL have accessible names in the
active language.

#### Scenario: Escape
- **WHEN** the viewer is open and the user presses Escape
- **THEN** the viewer closes and focus is on the thumbnail that opened it

#### Scenario: Close button in Ukrainian
- **WHEN** the viewer is open with active language `uk`
- **THEN** its close, previous and next buttons have `uk` accessible names

### Requirement: Post and certificate photos open in the viewer
The images on a post page and a certificate photo in the moderation queue SHALL open in
the viewer, as review photos do. A post's viewer SHALL move between that post's images;
the cover SHALL NOT open it.

#### Scenario: Post image
- **WHEN** a visitor clicks the first image of a post with two images
- **THEN** the viewer opens showing it, and Next shows the second image

#### Scenario: Certificate photo
- **WHEN** an admin clicks a pending certificate's photo in the Certificates tab
- **THEN** the viewer opens showing that photo, and the moderation page stays open behind it
