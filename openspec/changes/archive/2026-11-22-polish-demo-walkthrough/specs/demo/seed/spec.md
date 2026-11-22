# Spec Delta

## ADDED Requirements

### Requirement: Seeded post and review pictures are credited photos
The demo seed SHALL take every post cover, post image and review photo from a set of real
underwater photographs kept in the repository. Every photo in the set SHALL have a credits
entry naming its author, source page and licence, and the licence SHALL allow reuse in this
project. Avatars MAY stay generated pictures.

#### Scenario: Pictures come from the photo set
- **WHEN** the demo community has been seeded
- **THEN** the bytes of every published post's cover, every post image and every review photo equal one of the photos in the set

#### Scenario: Every photo is credited
- **WHEN** the photo set is read
- **THEN** each photo file has exactly one credits entry with a non-empty author, source URL and licence, and each credits entry names an existing photo file

#### Scenario: The set covers the seed
- **WHEN** the demo community has been seeded
- **THEN** at least 15 different photos of the set are in use
