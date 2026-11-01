# Spec Delta

## ADDED Requirements

### Requirement: The markers endpoint filters by minimum rating
The `minRating` parameter, a number from 1 to 5, SHALL keep only sites whose average rating is at
least that value. Sites without ratings SHALL not match it. It SHALL combine with the other filters.

#### Scenario: Minimum rating
- **GIVEN** sites with average ratings 4.5 and 3.9, and a site without ratings
- **WHEN** a client requests markers with `minRating=4`
- **THEN** only the site rated 4.5 is returned

#### Scenario: Invalid minimum rating
- **WHEN** a client requests markers with `minRating=6`
- **THEN** the response is a 400 problem detail

### Requirement: The markers endpoint sorts by rating
With `sort=rating` the markers SHALL be ordered by average rating, highest first, with sites
without ratings last and ties ordered by name. `sort=name` SHALL keep the default name order. Any
other value SHALL be refused with 400.

#### Scenario: Highest rated first
- **GIVEN** "Canyon" rated 4.8, "Blue Hole" rated 4.8, "Arch" rated 3.0 and "Bells" without ratings
- **WHEN** a client requests markers with `sort=rating`
- **THEN** the order is "Blue Hole", "Canyon", "Arch", "Bells"

#### Scenario: Unknown sort
- **WHEN** a client requests markers with `sort=depth`
- **THEN** the response is a 400 problem detail

### Requirement: Site cards show the rating
Each site card in the result list SHALL show the site's rating with its count, or the
no-ratings text when the site has none, before the difficulty and depth.

#### Scenario: Rated site
- **WHEN** the result list shows a site with `averageRating` 4.9 and `ratingCount` 342
- **THEN** its card shows "4.9" and "(342)"

#### Scenario: Unrated site
- **WHEN** the result list shows a site with `ratingCount` 0
- **THEN** its card shows the no-ratings text of the active language

## MODIFIED Requirements

### Requirement: The map page searches and filters
The map page SHALL offer a search box, difficulty and gear chips, country and region selects,
depth inputs, a "Min rating" select and a sort select. A change SHALL update both the map's
markers and a result list of site cards linking to the site pages, and show the number of matches.
The result list SHALL be sorted by rating unless the user chooses sorting by name.

#### Scenario: Filter applied
- **WHEN** a user presses the "Beginner" chip
- **THEN** the markers request has `difficulty=1`
- **AND** the map and the result list hold only the sites returned

#### Scenario: Intermediate covers two levels
- **WHEN** a user presses the "Intermediate" chip
- **THEN** the markers request has `difficulty=2` and `difficulty=3`

#### Scenario: Regions follow the country
- **WHEN** a user selects a country
- **THEN** the region select offers only that country's regions
- **AND** changing the country clears a selected region

#### Scenario: Clear all
- **WHEN** a user with active filters presses "Clear all"
- **THEN** every filter and the search are cleared and all sites are shown

#### Scenario: Minimum rating chosen
- **WHEN** a user selects "4 stars and up"
- **THEN** the markers request has `minRating=4`
- **AND** the active filter count includes it

#### Scenario: Sorting
- **WHEN** the map page loads with no sort chosen
- **THEN** the markers request has `sort=rating`
- **AND** when the user chooses sorting by name, the markers request has `sort=name`

### Requirement: The URL holds the search and filters
The search, filters and sort SHALL be kept in the URL, so reloading or sharing it restores them.

#### Scenario: Opening a filtered URL
- **WHEN** the app is opened at `/?q=reef&difficulty=beginner&gear=torch`
- **THEN** the search box holds "reef" and the "Beginner" and "Torch" chips are pressed
- **AND** the markers request uses those filters

#### Scenario: Opening a URL with rating and sort
- **WHEN** the app is opened at `/?minRating=4.5&sort=name`
- **THEN** the "Min rating" select shows "4.5 stars and up" and the sort select shows the name order
- **AND** the markers request has `minRating=4.5` and `sort=name`

#### Scenario: Hand-edited rating
- **WHEN** the app is opened at `/?minRating=lots&sort=depth`
- **THEN** the markers request has no `minRating` and has `sort=rating`
