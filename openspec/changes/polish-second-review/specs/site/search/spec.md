## MODIFIED Requirements

### Requirement: Filters sit behind a toggle at every width
The map page SHALL hide the filters behind a Filters button at every width. The filters
are collapsed when the page opens. The button's label SHALL include the number of active
filters when there are any, and the button SHALL carry `aria-expanded`. On a desktop,
pressing it SHALL replace the button with the filters form in the same place in the
panel's search section, and move focus into the form. The form SHALL have a "Hide filters"
button; pressing it SHALL close the form, show the Filters button again and put focus on it.

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
On a desktop, while the filters form is closed, the map page SHALL show one chip for each
active filter under the Filters button, labelled with the filter's value in the active
language. Each chip SHALL have a remove control named after the filter it removes.
Removing a chip SHALL clear only that filter and update the URL and the markers request.
While the filters form is open, and on a phone at any time, the removable chips SHALL not
be shown; there the Filters button's count and the filters themselves show the selection.

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
