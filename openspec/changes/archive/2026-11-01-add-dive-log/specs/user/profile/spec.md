# Spec Delta

## ADDED Requirements

### Requirement: The profile page shows dive statistics
The profile page SHALL show the diver's dives, sites and deepest dive, unless `showStatistics` is false and the visitor is not the owner.

#### Scenario: Statistics shown
- **WHEN** a visitor opens a profile with `showStatistics` true
- **THEN** the page shows the three numbers

#### Scenario: Statistics hidden
- **WHEN** another visitor opens a profile with `showStatistics` false
- **THEN** the statistics are not requested or shown

### Requirement: The profile page shows the dive history and visited sites
The profile page SHALL show the diver's visited sites with their dive counts, and their dives without buddies or notes, with more
loading on request. For another visitor when `showDiveLog` is false, it SHALL show a notice instead, and SHALL NOT request them.

#### Scenario: History shown
- **WHEN** a visitor opens a profile with `showDiveLog` true
- **THEN** the page shows visited sites linking to their pages, and the dives

#### Scenario: History hidden
- **WHEN** another visitor opens a profile with `showDiveLog` false
- **THEN** the page shows the hidden-history notice of the active language, and neither request is made

#### Scenario: Owner of a hidden history
- **WHEN** the owner opens their profile with `showDiveLog` false
- **THEN** the page shows their history

#### Scenario: No dives
- **WHEN** a diver has no dives
- **THEN** the page shows the no-dives text of the active language
