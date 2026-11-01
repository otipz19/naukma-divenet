# achievement/achievements Specification

## Purpose

The eight achievement rules, how they are awarded on a user's actions, and the API that reports earned achievements and progress (US-10).

## Requirements

### Requirement: Achievements are awarded on relevant actions

The system SHALL evaluate a user's rules when they log or edit a dive, when one of their posts becomes published, and when one of their submitted sites is approved. An achievement whose target is met SHALL be awarded before the request answers, with the current time as its earned date.

#### Scenario: First dive

- **WHEN** a user logs their first dive
- **THEN** `first-dive` is earned by the time the API answers

#### Scenario: Ten dives

- **WHEN** a user logs their tenth dive
- **THEN** `ten-dives` is earned, and it was not earned after the ninth

#### Scenario: Ten sites

- **WHEN** a user has dived at 10 different sites
- **THEN** `ten-sites` is earned, and repeat dives at one site do not count towards it

#### Scenario: Five countries

- **WHEN** a user has dived in 5 countries
- **THEN** `globetrotter` is earned

#### Scenario: Deep dive

- **WHEN** a user logs a dive to 40 m
- **THEN** `deep-diver` is earned

#### Scenario: Editing a dive

- **WHEN** a user edits a dive's depth to 40 m
- **THEN** `deep-diver` is earned

#### Scenario: First post

- **WHEN** a user publishes their first post
- **THEN** `first-post` is earned

#### Scenario: A draft does not count

- **WHEN** a user saves a draft
- **THEN** `first-post` is not earned

#### Scenario: Five posts

- **WHEN** a user has 5 published posts
- **THEN** `five-posts` is earned

#### Scenario: Publishing again counts

- **WHEN** a user with 5 posts moves one to drafts, and later publishes it again before earning `five-posts`
- **THEN** `five-posts` is earned once all 5 are published

#### Scenario: Approved site

- **WHEN** an admin approves a site a user submitted
- **THEN** the author earns `first-site`

#### Scenario: Rejected site

- **WHEN** an admin rejects a site a user submitted
- **THEN** `first-site` is not earned

### Requirement: An award is permanent and made once

An earned achievement SHALL stay earned when the activity behind it is deleted, and SHALL keep its first earned date.

#### Scenario: Deleting the dive

- **WHEN** a user deletes the dive that earned `first-dive`
- **THEN** `first-dive` stays earned

#### Scenario: Earning conditions met again

- **WHEN** a user who earned `first-dive` logs another dive
- **THEN** `first-dive` keeps its first earned date

### Requirement: A failed evaluation does not refuse the action

The action SHALL succeed and stay saved when evaluating the rules fails.

#### Scenario: Evaluation fails

- **WHEN** evaluating the rules fails while a user logs a dive
- **THEN** the API answers 201 and the dive is saved

### Requirement: The API reports achievements and progress

`GET /api/v1/users/{id}/achievements` SHALL answer anyone with all eight achievements in a fixed order, each with its code, target, progress and earned date. Progress SHALL be a whole number capped at the target. It SHALL be left out for anyone but the owner when the profile hides statistics, while earned dates stay public.

#### Scenario: Earned and locked

- **WHEN** anyone reads the achievements of a user with 3 dives
- **THEN** `first-dive` has an earned date and progress 1 of 1, and `ten-dives` has no earned date and progress 3 of 10

#### Scenario: Depth is rounded down

- **WHEN** a user's deepest dive is 39.9 m
- **THEN** `deep-diver` has progress 39 of 40 and is not earned

#### Scenario: Progress after a deletion

- **WHEN** a user earned `first-dive` and deleted their only dive
- **THEN** it has an earned date and progress 0 of 1

#### Scenario: Statistics hidden

- **WHEN** another visitor reads the achievements of a user who hides statistics
- **THEN** no achievement has progress, and earned dates are present

#### Scenario: Owner with statistics hidden

- **WHEN** the owner reads their own achievements while hiding statistics
- **THEN** progress is present

#### Scenario: Unknown user

- **WHEN** anyone reads the achievements of a user who does not exist
- **THEN** the API answers 404

### Requirement: Every achievement has both languages

Every achievement definition SHALL have a name and description in the `en` and `uk` locale files.

#### Scenario: Locale check

- **WHEN** the definitions are compared with the locale files
- **THEN** every code has a name and description in both
