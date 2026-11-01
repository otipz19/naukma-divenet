# user/profile

## ADDED Requirements

### Requirement: The profile page shows the author's posts

The profile page SHALL show the diver's published posts as cards with cover, title, excerpt, date, reading time, region and site, in pages. The owner SHALL also see their drafts and a Write a post link. Other visitors SHALL NOT trigger a drafts request.

#### Scenario: Reading a blog

- **WHEN** a visitor opens the profile of a diver with published posts
- **THEN** the page shows the post cards, each linking to its post page

#### Scenario: Paging

- **WHEN** a diver has more posts than one page holds and the visitor chooses Next
- **THEN** the page shows the next posts

#### Scenario: No posts

- **WHEN** a visitor opens the profile of a diver with no published posts
- **THEN** the page shows no posts section

#### Scenario: Owner

- **WHEN** the owner opens their profile
- **THEN** the page shows a Write a post link and their drafts, each linking to its editor

#### Scenario: Other visitor makes no drafts request

- **WHEN** another visitor opens the profile
- **THEN** no drafts are requested or shown
