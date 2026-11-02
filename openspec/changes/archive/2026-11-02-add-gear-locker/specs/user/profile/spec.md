# user/profile

## ADDED Requirements

### Requirement: The profile page shows the gear locker

The profile page SHALL show the diver's gear locker. The owner SHALL be able to add and remove items there, and an empty locker SHALL show them an empty message. Another visitor SHALL see no controls, and no section when the locker is empty.

#### Scenario: Reading

- **WHEN** a visitor opens a profile with items
- **THEN** the page shows the items, with no add or remove controls

#### Scenario: Empty, as a visitor

- **WHEN** a visitor opens a profile with no items
- **THEN** the page shows no gear locker section

#### Scenario: Empty, as the owner

- **WHEN** the owner opens their profile with no items
- **THEN** the page shows an empty message and the add form

#### Scenario: Adding

- **WHEN** the owner enters a name and adds it
- **THEN** the item is listed and the field is cleared

#### Scenario: Blank name

- **WHEN** the owner adds a blank name
- **THEN** the page shows a translated error and sends nothing

#### Scenario: Removing

- **WHEN** the owner chooses Remove on an item
- **THEN** the item is removed from the list

#### Scenario: Saving fails

- **WHEN** the server refuses to add an item
- **THEN** the page shows an alert and keeps the name

#### Scenario: In Ukrainian

- **WHEN** the owner opens their profile in `uk`
- **THEN** the section's title and controls are in Ukrainian
