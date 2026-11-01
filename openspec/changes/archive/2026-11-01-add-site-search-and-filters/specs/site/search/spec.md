# Spec Delta

## Purpose

Defines how divers narrow the dive sites by text and by combinable filters, on the
markers endpoint and on the map page, in either language.

## ADDED Requirements

### Requirement: The markers endpoint searches by text
The `q` parameter SHALL match sites whose name, region name or country name contains it,
ignoring case. The characters `%` and `_` in `q` SHALL match themselves. Repeated `qRegion`
and `qCountry` parameters SHALL give region and country codes that also count as text matches.

#### Scenario: Match by name
- **WHEN** a client requests markers with `q=blue` and a site is named "Blue Hole"
- **THEN** that site is returned and a site named "Canyon" in another place is not

#### Scenario: Match by region and by country
- **WHEN** a client requests markers with `q=dahab`, and then with `q=egypt`
- **THEN** each response includes a site in the region `eg-dahab`

#### Scenario: Wildcards are literal
- **WHEN** a client requests markers with `q=%`
- **THEN** a site without a percent sign in its name, region or country is not returned

#### Scenario: Codes count as text matches
- **WHEN** a client requests markers with `q=дахаб&qRegion=eg-dahab`
- **THEN** a site in the region `eg-dahab` is returned

### Requirement: The markers endpoint filters by site facts
The endpoint SHALL accept repeated `difficulty` values (any of), repeated `gear` codes (the
site requires all of them), `country`, `region`, `minDepth` and `maxDepth`. A site matches
the depth filters when its depth range overlaps the requested range.

#### Scenario: Any of several difficulties
- **WHEN** a client requests markers with `difficulty=1&difficulty=2`
- **THEN** sites of difficulty 1 and 2 are returned, and a site of difficulty 3 is not

#### Scenario: All of several gear items
- **WHEN** a client requests markers with `gear=torch&gear=smb`
- **THEN** a site requiring both is returned
- **AND** a site requiring only `torch`, and a site that only recommends them, are not

#### Scenario: Country and region
- **WHEN** a client requests markers with `country=EG`, and then with `region=eg-dahab`
- **THEN** the first includes every Egyptian site and the second only the sites in Dahab

#### Scenario: Depth ranges overlap
- **GIVEN** a site with depths 16 to 32
- **WHEN** a client requests markers with `minDepth=5&maxDepth=30`
- **THEN** the site is returned
- **AND** with `minDepth=33` it is not, and with `maxDepth=15` it is not

### Requirement: Filters combine
The text search and every filter SHALL combine, so a returned site satisfies all of them.

#### Scenario: Text and filter together
- **WHEN** a client requests markers with `q=dahab&difficulty=1`
- **THEN** only the Dahab sites of difficulty 1 are returned

#### Scenario: Invalid parameter
- **WHEN** a client requests markers with `difficulty=hard`
- **THEN** the response is a 400 problem detail

### Requirement: The map page searches and filters
The map page SHALL offer a search box, difficulty and gear chips, country and region selects
and depth inputs. A change SHALL update both the map's markers and a result list of site cards
linking to the site pages, and show the number of matches.

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

### Requirement: Search works with names in the active language
When the search text matches translated region or country names of the active language, the
page SHALL send the matching codes with the search.

#### Scenario: Search in Ukrainian
- **WHEN** the active language is `uk` and a user types "дахаб"
- **THEN** the markers request has `q=дахаб` and `qRegion=eg-dahab`

### Requirement: An empty result says so
When no site matches, the page SHALL show a "nothing found" message in place of the list.

#### Scenario: Nothing found
- **WHEN** the markers request returns an empty array
- **THEN** the page shows the nothing-found text of the active language

### Requirement: The URL holds the search and filters
The search and filters SHALL be kept in the URL, so reloading or sharing it restores them.

#### Scenario: Opening a filtered URL
- **WHEN** the app is opened at `/?q=reef&difficulty=beginner&gear=torch`
- **THEN** the search box holds "reef" and the "Beginner" and "Torch" chips are pressed
- **AND** the markers request uses those filters

### Requirement: Narrow screens show a filters toggle and a results sheet
Below 1100 px wide, the filters SHALL be hidden behind a button that shows how many are
active, and the results SHALL be in a sheet over the map that can be expanded.

#### Scenario: Toggles report their state
- **WHEN** a user with one active filter presses the filters button
- **THEN** its label includes the count 1 and its `aria-expanded` becomes `true`
