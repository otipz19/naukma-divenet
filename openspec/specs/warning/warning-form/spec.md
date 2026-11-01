# warning/warning-form Specification

## Purpose

Defines the page where a signed-in diver reports a warning about a site or edits a warning they
posted.

## Requirements

### Requirement: The warning form has a type and a text
`/sites/:id/warnings/new` SHALL require sign-in and show a back link to the site, the heading
"Report a warning" with the site's name, a type select with the four warning types and no
preselected type, a text area of up to 1000 characters, and Cancel and "Post warning" buttons.

#### Scenario: New warning form
- **WHEN** a signed-in user opens `/sites/7/warnings/new`
- **THEN** the page shows the heading "Report a warning", the site's name and a link to `/sites/7`
- **AND** the type select offers Hazard, Incident, Changed conditions and Marine life, none selected, and the text is empty

#### Scenario: Anonymous visitor
- **WHEN** an anonymous visitor opens `/sites/7/warnings/new`
- **THEN** the app shows the login page, which returns to `/sites/7/warnings/new` after sign-in

#### Scenario: Form in Ukrainian
- **WHEN** the active language is `uk`
- **THEN** every label, option and button is the `uk` text

#### Scenario: Unknown or unapproved site
- **WHEN** the site request answers 404
- **THEN** the page shows the site not-found message and a link to `/`

#### Scenario: Cancel
- **WHEN** the user presses Cancel
- **THEN** the app navigates to `/sites/7` and no request is sent

### Requirement: The form posts a warning
Posting SHALL send the chosen type and the text, then return to the site page.

#### Scenario: Post
- **WHEN** the user picks "Changed conditions", types "Visibility down to 10 m" and posts
- **THEN** the create request has type `CHANGED_CONDITIONS` and that text
- **AND** the app navigates to `/sites/7`

### Requirement: The form refuses an incomplete warning
Without a type, or with a blank text, the form SHALL send no request and SHALL show a field
message on what is missing. A request the server refuses SHALL show an error alert and keep the
user's input.

#### Scenario: No type
- **WHEN** the user types a text but picks no type and posts
- **THEN** no request is sent and the type field shows its required message

#### Scenario: Blank text
- **WHEN** the user picks a type, leaves the text blank and posts
- **THEN** no request is sent and the text field shows its required message

#### Scenario: Server error
- **WHEN** the create request answers 400
- **THEN** the form shows an error alert and keeps the values entered

### Requirement: The same form edits an own warning
`/sites/:id/warnings/:warningId/edit` SHALL load the warning into the form, show the heading
"Edit warning" and the button "Save warning", and saving SHALL update that warning and return
to the site page. A warning that is not the user's own, or that answers 404, SHALL show the
warning not-found message and a link to the site.

#### Scenario: Edit loads the warning
- **GIVEN** the user's warning 12 on site 7 has type `HAZARD` and a text
- **WHEN** the user opens `/sites/7/warnings/12/edit`
- **THEN** "Hazard" is selected and the text is shown

#### Scenario: Save
- **WHEN** the user changes the type to "Incident" and saves
- **THEN** an update request for warning 12 is sent with type `INCIDENT`
- **AND** the app navigates to `/sites/7`

#### Scenario: Someone else's warning
- **WHEN** a signed-in user opens the edit page of a warning another user posted
- **THEN** the page shows the warning not-found message and a link to `/sites/7`

#### Scenario: Hidden or unknown warning
- **WHEN** the warning request answers 404
- **THEN** the page shows the warning not-found message and a link to `/sites/7`
