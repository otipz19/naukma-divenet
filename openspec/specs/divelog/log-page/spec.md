# divelog/log-page Specification

## Purpose

Defines the page where a signed-in diver reads their dive log and adds, edits and deletes entries.

## Requirements

### Requirement: The dive log page needs a signed-in user
`/dive-log` SHALL need a signed-in user, and the main navigation SHALL link to it.

#### Scenario: Signed out
- **WHEN** a signed-out visitor opens `/dive-log`
- **THEN** the login page is shown, and logging in returns to `/dive-log`

#### Scenario: Navigation
- **WHEN** a visitor opens any page
- **THEN** the main navigation has a "Dive log" link to `/dive-log`

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
The form SHALL let the user find a site by text, choose it, and set the date and optional fields. It SHALL validate them
before sending, and clear and refresh the table after saving. The date SHALL default to today.

#### Scenario: Site search
- **WHEN** a user types into the site field
- **THEN** matching approved sites are offered, and choosing one selects it

#### Scenario: Logged
- **WHEN** a user chooses a site and saves
- **THEN** the request carries the values, the form is cleared and the table is refreshed

#### Scenario: Form errors
- **WHEN** a user saves with no site chosen, or with a max depth of 401
- **THEN** field errors in the active language are shown and nothing is sent

#### Scenario: Failed save
- **WHEN** the API answers 500
- **THEN** the page shows an alert and keeps the entered values

### Requirement: The page can start from a site
`/dive-log?site={id}` SHALL open with that site chosen.

#### Scenario: Site in the URL
- **WHEN** a user opens `/dive-log?site=7`
- **THEN** the form shows site 7 as chosen

### Requirement: Entries are edited and deleted from the page
Each row SHALL have an Edit action that fills the form with the entry. While editing, the form SHALL offer Save, Cancel and
Delete, and Delete SHALL ask for confirmation.

#### Scenario: Edit
- **WHEN** a user edits a row and saves
- **THEN** the update request carries the new values and the table is refreshed

#### Scenario: Delete
- **WHEN** a user presses Delete and confirms
- **THEN** the delete request is sent and the row leaves the table

#### Scenario: Delete not confirmed
- **WHEN** a user presses Delete and cancels the confirmation
- **THEN** nothing is sent
