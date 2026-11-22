# divelog/log-page Specification

## Purpose

Defines the page where a signed-in diver reads their dive log and adds, edits and deletes entries.

## Requirements

### Requirement: The dive log page needs a signed-in user
`/dive-log` SHALL need a signed-in user, and the main navigation SHALL link to it for every visitor
except an admin. An admin who opens it SHALL be sent to `/admin/moderation`, as `auth` requires.

#### Scenario: Signed out
- **WHEN** a signed-out visitor opens `/dive-log`
- **THEN** the login page is shown, and logging in returns to `/dive-log`

#### Scenario: Navigation
- **WHEN** a visitor opens any page
- **THEN** the main navigation has a "Dive log" link to `/dive-log`

#### Scenario: No entry for the admin
- **WHEN** an admin opens any page
- **THEN** the main navigation has no "Dive log" link

### Requirement: The page lists the user's dives
The page SHALL show the user's statistics and a table of dives, newest first, with date, site and place in the active
language, max depth, water temperature and visibility. A missing value SHALL show a dash, and each site name SHALL link to its
page. More dives SHALL load on request.

#### Scenario: Table
- **WHEN** the user has dives
- **THEN** the table shows them, with "30.4 m", "24 °C" and a dash for a missing visibility

#### Scenario: Date is the logged day
- **WHEN** an entry's date is 2026-05-12
- **THEN** it shows as 12 May 2026 in every time zone

#### Scenario: Empty log
- **WHEN** the user has no dives
- **THEN** the page shows the empty-log text of the active language

#### Scenario: Load more
- **WHEN** the log has more than one page and the user presses "Load more"
- **THEN** the next page is added to the table

#### Scenario: Failed load
- **WHEN** the log cannot be loaded
- **THEN** the page shows an alert

### Requirement: The form logs a dive
The dive form SHALL open in a dialog titled "Log a dive". It SHALL let the user find a site by text, choose it, and set the date
and optional fields. It SHALL validate them before sending. After saving, the dialog SHALL close and the table SHALL be refreshed.
The date SHALL default to today. The page SHALL show no form outside the dialog.

#### Scenario: Site search
- **WHEN** a user types into the site field of the dialog
- **THEN** matching approved sites are offered, and choosing one selects it

#### Scenario: Logged
- **WHEN** a user chooses a site and saves
- **THEN** the request carries the values, the dialog is gone and the table is refreshed

#### Scenario: Form errors
- **WHEN** a user saves with no site chosen, or with a max depth of 401
- **THEN** field errors in the active language are shown in the dialog and nothing is sent

#### Scenario: Failed save
- **WHEN** the API answers 500
- **THEN** the dialog stays open with an alert and keeps the entered values

#### Scenario: No form on the page
- **WHEN** a user opens `/dive-log`
- **THEN** the page shows the statistics and the table, and no dive form

### Requirement: The page can start from a site
`/dive-log?site={id}` SHALL open the Log a dive dialog with that approved site chosen. Closing or saving the dialog SHALL not open it
again.

#### Scenario: Site in the URL
- **WHEN** a user opens `/dive-log?site=7`
- **THEN** the Log a dive dialog is open and shows site 7 as chosen

#### Scenario: Not reopened
- **WHEN** a user opened `/dive-log?site=7`, saves the dive, and then presses Log a dive in the header
- **THEN** the dialog opens with no site chosen

### Requirement: Entries are edited and deleted from the page
Each row SHALL have an Edit action and a Delete action, each with an accessible name naming the site and date. Edit SHALL open the
form in a dialog titled "Edit dive: <site>, <date>", filled with the entry. Delete SHALL ask for confirmation in a confirmation dialog
that names the site and date.

#### Scenario: Edit
- **WHEN** a user presses Edit on a row, changes the depth and saves
- **THEN** the dialog title named the entry, the update request carries the new values, the dialog is gone and the table is refreshed

#### Scenario: Delete
- **WHEN** a user presses Delete on a row and confirms
- **THEN** the delete request is sent and the row leaves the table

#### Scenario: Delete not confirmed
- **WHEN** a user presses Delete on a row and cancels the confirmation
- **THEN** nothing is sent and the row stays

#### Scenario: Failed delete
- **WHEN** the user confirms Delete and the API answers 500
- **THEN** the page shows an alert and the row stays

### Requirement: The dive log page announces an unlocked achievement

After a saved dive earns an achievement, the dive log page SHALL show one toast per earned achievement, titled with its name and
showing its description and a link to the user's profile achievements. A save that earns nothing SHALL show no toast.

#### Scenario: A save earns one

- **WHEN** a user saves a dive that earns `first-dive`
- **THEN** a toast shows "Achievement unlocked" with its name and description, and the dialog is gone

#### Scenario: A save earns two

- **WHEN** a user saves a dive that earns two achievements
- **THEN** two toasts name them

#### Scenario: A save earns nothing

- **WHEN** a user saves a dive that earns nothing
- **THEN** no toast is shown

#### Scenario: The next save

- **WHEN** a toast is showing and the user saves another dive that earns nothing
- **THEN** no new toast is added

#### Scenario: Link to achievements

- **WHEN** a toast for an earned achievement is shown
- **THEN** it has a "See achievements" link to the user's profile

### Requirement: The header offers to log a new dive

The dive log page's header SHALL offer a Log a dive button that opens the dive dialog with an empty entry, with focus on its site
field.

#### Scenario: While editing
- **WHEN** the user has edited a dive and closed its dialog, and then presses Log a dive in the header
- **THEN** a dialog titled "Log a dive" is open, its fields are empty except today's date, and its site field has focus

### Requirement: The table header spans every column
The dive log table's header row SHALL have a header cell for every column, the Edit and
Delete column included, so the header background runs the full width of the table. The
actions column's header SHALL be hidden from sight and SHALL be read by screen readers
as "Actions" in the active language.

#### Scenario: Header cell over the actions
- **WHEN** the user's own dive log table shows a dive with Edit and Delete
- **THEN** the header row has as many cells as the dive's row
- **AND** the last header cell is a column header named "Actions"
