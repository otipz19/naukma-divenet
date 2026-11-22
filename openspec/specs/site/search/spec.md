# site/search Specification

## Purpose

Defines how divers narrow the dive sites by text and by combinable filters, on the
markers endpoint and on the map page, in either language.

## Requirements

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

### Requirement: Filters sit behind a toggle at every width
The map page SHALL hide the filters, collapsed on open, behind a Filters button that
carries `aria-expanded` and the number of active filters. On a desktop, pressing it SHALL
put the filters form in the button's place and move focus into it. The form's "Hide
filters" button SHALL close it and bring the Filters button back, focused.

#### Scenario: Collapsed on open
- **WHEN** `/` is opened on a desktop-width viewport
- **THEN** the Filters button has `aria-expanded="false"`, and the difficulty chips are not shown

#### Scenario: Toggles report their state
- **WHEN** a user with one active filter is shown the Filters button on a desktop-width viewport
- **THEN** its label includes the count 1 and its `aria-expanded` is `false`

#### Scenario: Opens in place of the button
- **WHEN** a user presses the Filters button on a desktop-width viewport
- **THEN** the difficulty chips are shown in the panel's search section, before the result list
- **AND** the Filters button is no longer shown and focus is inside the filters form

#### Scenario: Hide filters
- **WHEN** a user with the filters open on a desktop-width viewport presses "Hide filters"
- **THEN** the difficulty chips are not shown
- **AND** the Filters button is shown again with `aria-expanded="false"` and has focus

### Requirement: Active filters show as removable chips
On a desktop with the filters form closed, the map page SHALL show under the Filters
button one chip per active filter, labelled in the active language, with a remove control
named after its filter. Removing a chip SHALL clear only that filter, in the URL and the
markers request. The chips SHALL not be shown while the form is open, nor on a phone.

#### Scenario: Chips for active filters
- **WHEN** the app is opened at `/?difficulty=beginner&gear=torch` on a desktop-width viewport
- **THEN** chips "Beginner" and "Torch" are shown under the Filters button while the filters are collapsed

#### Scenario: Remove one
- **WHEN** the user presses the remove control of the "Beginner" chip
- **THEN** the markers request has no `difficulty` and still has the torch filter
- **AND** the URL has no `difficulty`

#### Scenario: No chips while the form is open
- **WHEN** a user at `/?difficulty=beginner` on a desktop-width viewport opens the filters
- **THEN** no "Remove filter: Beginner" control is shown

#### Scenario: No chips on a phone
- **WHEN** `/?difficulty=beginner&gear=torch` is opened on a 390 px wide viewport
- **THEN** no remove-filter control is shown over the map
- **AND** the Filters button's label includes the count 2

### Requirement: The result count stays in view
On a desktop, the side panel SHALL keep at its top the search box, the number of matches
and, below the count, either the Filters button with the active filter chips or the open
filters form. The result list SHALL scroll below them, so the count never scrolls out of
view; a filters form taller than the space it may take SHALL scroll inside the panel's
top part.

#### Scenario: Count fixed while the list scrolls
- **WHEN** the side panel's body is scrolled to the bottom of a long result list on a desktop-width viewport
- **THEN** the number of matches is still inside the visible part of the panel

#### Scenario: Count above the Filters button
- **WHEN** `/` is opened on a desktop-width viewport
- **THEN** the number of matches comes before the Filters button in the panel's search section

### Requirement: Phones show filters in a dialog and results in a sheet
Below 1100 px wide, the search box and the Filters button SHALL float over the top of the
map. The Filters button SHALL open the filters in a dialog. The results SHALL be in a sheet
at the bottom of the map that starts in a peek state and can be expanded. The controls
floating over the map SHALL stay under the open navigation drawer.

#### Scenario: Filters dialog
- **WHEN** a user on a 390 px wide viewport presses the Filters button
- **THEN** a modal dialog named "Filters" holds the filters, a "Clear all" button and a "Show N sites" button, where N is the number of matches
- **AND** a filter changed in it updates the markers request at once
- **AND** pressing "Show N sites" closes the dialog and returns focus to the Filters button

#### Scenario: Results sheet peek and expand
- **WHEN** `/` is opened on a 390 px wide viewport with several matches
- **THEN** the results sheet shows the number of matches and the first site card
- **AND** its expand button has `aria-expanded="false"`
- **AND** pressing the expand button sets `aria-expanded="true"` and shows every site card

#### Scenario: Drawer covers the map controls
- **WHEN** a user on a 390 px wide viewport opens the navigation drawer on the map page
- **THEN** at the centre of the search box, which the drawer overlaps, the topmost element belongs to the drawer

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
