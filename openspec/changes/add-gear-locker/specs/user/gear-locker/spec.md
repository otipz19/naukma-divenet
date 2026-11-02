# user/gear-locker

## Purpose

A diver's personal equipment inventory: a public list of named items that only its owner can change.

## ADDED Requirements

### Requirement: Anyone can read a gear locker

`GET /api/v1/users/{id}/gear-locker` SHALL answer anyone with the user's items, ordered by name without regard to case.

#### Scenario: Reading

- **WHEN** an anonymous visitor reads a locker holding "regulator" and "BCD"
- **THEN** the API answers 200 with "BCD" and then "regulator"

#### Scenario: Unknown user

- **WHEN** anyone reads the locker of a user who does not exist
- **THEN** the API answers 404

### Requirement: The owner adds an item

`POST /api/v1/gear-locker` SHALL add an item to the signed-in user's locker. A name SHALL have 1 to 100 characters, and is stored stripped. Equal names SHALL be allowed, as a diver can own two of something. A locker SHALL hold at most 100 items.

#### Scenario: Adding

- **WHEN** a signed-in user adds " Regulator "
- **THEN** the API answers 201 with an item named "Regulator"

#### Scenario: Two of the same

- **WHEN** a user adds a name their locker already holds
- **THEN** the API answers 201, and the locker holds both

#### Scenario: Invalid name

- **WHEN** a name is blank or longer than 100 characters
- **THEN** the API answers 400 naming `name`, and nothing is stored

#### Scenario: Locker full

- **WHEN** a user with 100 items adds another
- **THEN** the API answers 400 naming `name`, and nothing is stored

#### Scenario: Anonymous visitor

- **WHEN** a request without a valid token adds an item
- **THEN** the API answers 401

### Requirement: The owner removes an item

`DELETE /api/v1/gear-locker/{id}` SHALL remove an item from its owner's locker. A request for an item that does not exist or belongs to someone else SHALL answer 404 and change nothing.

#### Scenario: Removing

- **WHEN** the owner removes an item
- **THEN** the API answers 204, and the item is gone

#### Scenario: Someone else's item

- **WHEN** another user, an admin included, removes an item
- **THEN** the API answers 404, and the item stays

#### Scenario: Unknown item

- **WHEN** a user removes an item that does not exist
- **THEN** the API answers 404
