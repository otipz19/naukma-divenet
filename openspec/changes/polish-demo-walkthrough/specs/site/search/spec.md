# Spec Delta

## ADDED Requirements

### Requirement: The map fits the matching sites
When the search or the filters change, and when the map page opens with a search or filters
in its URL, the map SHALL move so that every matching site is in view, with a zoom limit so
that a single site is not shown closer than a regional view. With no search and no filters,
or with no matching site, the map SHALL keep its current view.

#### Scenario: Filter narrows the sites
- **WHEN** a user presses the "Technical" chip and two sites in Mexico and Ecuador match
- **THEN** the map's view contains both sites' markers and is zoomed in further than the world view

#### Scenario: One matching site
- **WHEN** a search matches exactly one site
- **THEN** the map centres on that site at no closer than the zoom limit

#### Scenario: Opened from a shared link
- **WHEN** the map page opens at `/?q=blue`
- **THEN** once the markers load, the map's view contains every site the search matched

#### Scenario: Filters cleared
- **WHEN** a user presses "Clear all"
- **THEN** the map keeps its current view

#### Scenario: Nothing found
- **WHEN** a search matches no site
- **THEN** the map keeps its current view and the empty-result text is shown

#### Scenario: No search on first load
- **WHEN** the map page opens at `/` with no search and no filters
- **THEN** the map shows its initial world view
