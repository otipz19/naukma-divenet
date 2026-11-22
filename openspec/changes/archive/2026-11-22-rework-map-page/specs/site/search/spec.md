## ADDED Requirements

### Requirement: Filters sit behind a toggle at every width
The map page SHALL hide the filters behind a Filters button at every width. The filters
are collapsed when the page opens. The button's label SHALL include the number of active
filters when there are any, and the button SHALL carry `aria-expanded`. On a desktop it
expands the filters in the side panel.

#### Scenario: Collapsed on open
- **WHEN** `/` is opened on a desktop-width viewport
- **THEN** the Filters button has `aria-expanded="false"`, and the difficulty chips are not shown

#### Scenario: Toggles report their state
- **WHEN** a user with one active filter presses the Filters button
- **THEN** its label includes the count 1 and its `aria-expanded` becomes `true`
- **AND** the difficulty chips are shown

### Requirement: Active filters show as removable chips
Under the search box, the map page SHALL show one chip for each active filter, labelled
with the filter's value in the active language, whether the filters are expanded or not.
Each chip SHALL have a remove control named after the filter it removes. Removing a chip
SHALL clear only that filter and update the URL and the markers request.

#### Scenario: Chips for active filters
- **WHEN** the app is opened at `/?difficulty=beginner&gear=torch`
- **THEN** chips "Beginner" and "Torch" are shown under the search box while the filters are collapsed

#### Scenario: Remove one
- **WHEN** the user presses the remove control of the "Beginner" chip
- **THEN** the markers request has no `difficulty` and still has the torch filter
- **AND** the URL has no `difficulty`

### Requirement: The result count stays in view
On a desktop, the side panel SHALL keep the search box, the Filters button, the active
filter chips and the number of matches fixed at its top. The expanded filters and the
result list SHALL scroll below them, so the count never scrolls out of view.

#### Scenario: Count fixed while the list scrolls
- **WHEN** the side panel's body is scrolled to the bottom of a long result list on a desktop-width viewport
- **THEN** the number of matches is still inside the visible part of the panel

### Requirement: Phones show filters in a dialog and results in a sheet
Below 1100 px wide, the search box and the Filters button SHALL float over the top of the
map. The Filters button SHALL open the filters in a dialog. The results SHALL be in a sheet
at the bottom of the map that starts in a peek state and can be expanded.

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

## REMOVED Requirements

### Requirement: Narrow screens show a filters toggle and a results sheet
**Reason**: The filters toggle is now used at every width (F-10), and the phone layout is
built to `MobileMap.html` (F-12).
**Migration**: See "Filters sit behind a toggle at every width" and "Phones show filters
in a dialog and results in a sheet".
