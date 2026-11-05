# site/search

## ADDED Requirements

### Requirement: The phone filters toggle shows the active filter count

The Filters toggle on narrow screens SHALL show how many filters are set, counting each difficulty, gear item and other filter value once, and SHALL show no count when none is set.

#### Scenario: Filters set
- **WHEN** the map is opened at a phone width with two difficulties and a region selected
- **THEN** the Filters toggle reads "Filters · 3"

#### Scenario: No filters
- **WHEN** the map is opened at a phone width with no filters
- **THEN** the Filters toggle reads "Filters"
