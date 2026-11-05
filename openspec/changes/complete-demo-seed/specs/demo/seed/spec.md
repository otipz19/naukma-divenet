# demo/seed

## Purpose

The demo community: under the `demo` profile, startup fills the product with demo divers and their content, so a demonstration never starts empty.

## ADDED Requirements

### Requirement: The demo profile seeds a demo community

When the `demo` profile is active and no demo diver exists, startup SHALL create, after the demo sites, at least 8 demo divers who can log in with the documented demo password. It SHALL also create their content: verified, pending and rejected certificates; dives; reviews with ratings; warnings; published posts and drafts; approved, pending and rejected site submissions; and gear locker items. Without that profile, startup SHALL create none of it.

#### Scenario: Demo profile on an empty database

- **WHEN** the application starts with the `demo` profile and no demo diver
- **THEN** at least 8 demo divers exist, and each can log in with the demo password
- **AND** at least 50 dives, 25 reviews, 5 warnings, 8 published posts and 2 drafts exist
- **AND** the site moderation queue holds 2 pending submissions, and the certificate queue holds at least 1 pending certificate

#### Scenario: Ratings come from the reviews

- **WHEN** the demo community has been seeded
- **THEN** every site with a seeded rating shows a review count and an average that match its reviews

#### Scenario: Seeded content has images

- **WHEN** the demo community has been seeded
- **THEN** every demo diver has an avatar, every published post has a cover, and at least one review has photos
- **AND** each of those images is served by `GET /media/{id}`

#### Scenario: No demo profile

- **WHEN** the application starts without the `demo` profile
- **THEN** no demo diver exists

### Requirement: The demo community is seeded once

The seeder SHALL do nothing when a demo diver already exists. A failure while seeding SHALL leave no demo content in the database.

#### Scenario: Restart

- **WHEN** the seeder runs again after the demo community exists
- **THEN** the number of users, dives, reviews and posts does not change

#### Scenario: Seed refers to a missing site

- **WHEN** the seed names a site that does not exist
- **THEN** startup fails, naming that site
- **AND** no demo diver exists

### Requirement: Demo divers have their achievements

After the demo content is committed, the seeder SHALL evaluate the achievements of every demo diver, so their profiles show the awards their content earns.

#### Scenario: Awards on a seeded profile

- **WHEN** the demo community has been seeded
- **THEN** every demo diver with at least one dive has the `first-dive` award
- **AND** at least one demo diver has an award for posts and one for an approved site
