# Spec Delta

## ADDED Requirements

### Requirement: A review's author links to their profile
Each review card SHALL link the author's name to `/users/{id}` and show their avatar, or their
initials when they have none. A review's `author` in the API SHALL carry `avatarUrl`, the avatar's
thumbnail URL, or null.

#### Scenario: Author with an avatar
- **WHEN** a review's author has an avatar
- **THEN** the card shows the thumbnail, and the name links to the author's profile

#### Scenario: Author without an avatar
- **WHEN** a review's author has no avatar
- **THEN** the card shows the initials, and the name links to the author's profile

#### Scenario: API field
- **WHEN** a client reads the reviews of a site whose author has an avatar
- **THEN** `author.avatarUrl` is that avatar's thumbnail URL
