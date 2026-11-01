# Spec Delta

## Purpose

Defines the "Recent warnings" section of the site page, where divers read a site's warnings,
report a new one and manage their own, and admins hide warnings.

## ADDED Requirements

### Requirement: The site page shows recent warnings
An approved site's page SHALL show a "Recent warnings" section above "About this site", laid out
as in `design/screens/Site.html`. Each warning SHALL be an Alert titled with its type, how long
ago it was posted and the author's display name, with the text as its body.

#### Scenario: Warning alert
- **GIVEN** a `HAZARD` warning by "Mira Koval" posted two days ago with text "Strong current on the bow line"
- **WHEN** a user opens the site page in `en`
- **THEN** the section shows an alert titled "Hazard · 2 days ago · Mira Koval" with that text

#### Scenario: Section placement
- **WHEN** a user opens an approved site's page
- **THEN** the "Recent warnings" heading comes before the "About this site" heading

#### Scenario: Ukrainian
- **WHEN** the active language is `uk`
- **THEN** the type and the time since posting are in Ukrainian

#### Scenario: Unapproved site
- **WHEN** the author opens their pending site's page
- **THEN** no warnings section is shown and no warnings request is sent

### Requirement: A warning's tone follows its type
Warnings of type `HAZARD` and `INCIDENT` SHALL use the danger tone; `CHANGED_CONDITIONS` and
`MARINE_LIFE` SHALL use the caution tone.

#### Scenario: Danger tone
- **WHEN** the site has an `INCIDENT` warning
- **THEN** its alert has the danger tone

#### Scenario: Caution tone
- **WHEN** the site has a `MARINE_LIFE` warning
- **THEN** its alert has the caution tone

### Requirement: The time since posting is relative for a month
The alert title SHALL say "today", "yesterday" or "n days ago" (in the active language) for a
warning posted in the last 30 calendar days, and the posting date otherwise.

#### Scenario: Yesterday
- **WHEN** a warning was posted on the previous calendar day
- **THEN** its title says "yesterday"

#### Scenario: Older warning
- **WHEN** a warning was posted on 3 March 2026 and today is 1 May 2026
- **THEN** its title shows "3 Mar 2026" in `en`

### Requirement: Only the two newest warnings show at first
The section SHALL show the two newest warnings. When the site has more, a "Show all warnings
(n)" button, with n the total, SHALL reveal the others; a "Load more warnings" button SHALL then
load further pages while more exist.

#### Scenario: Collapsed
- **GIVEN** a site with 5 warnings
- **WHEN** a user opens its page
- **THEN** the two newest warnings are shown with a "Show all warnings (5)" button

#### Scenario: Expanded
- **WHEN** the user presses "Show all warnings (5)"
- **THEN** all 5 warnings are shown and the button is gone

#### Scenario: Load more
- **GIVEN** a site with more warnings than one page holds
- **WHEN** the user has expanded the list and presses "Load more warnings"
- **THEN** the next page is requested and its warnings are added after the shown ones

#### Scenario: Two or fewer
- **WHEN** the site has 2 warnings
- **THEN** both are shown and there is no "Show all warnings" button

#### Scenario: No warnings
- **WHEN** the site has no warnings
- **THEN** the section shows the no-warnings text of the active language

#### Scenario: Load failure
- **WHEN** the warnings request fails
- **THEN** the section shows an error alert and the rest of the page still renders

### Requirement: The section offers to report a warning
The section SHALL have a "Report a warning" link to `/sites/{id}/warnings/new`, for signed-in
and anonymous users alike; the form page asks anonymous users to sign in.

#### Scenario: Report link
- **WHEN** a user opens site 7's page
- **THEN** a "Report a warning" link points to `/sites/7/warnings/new`

### Requirement: Authors manage their warnings on the site page
The signed-in user's own warnings SHALL have Edit and Delete buttons. Edit SHALL open the
warning form for that warning. Delete SHALL ask for confirmation, then delete the warning and
refresh the section. Other users' warnings SHALL have no such buttons.

#### Scenario: Own warning
- **WHEN** a signed-in user opens a site where they posted a warning
- **THEN** their warning has Edit and Delete buttons and other warnings have none

#### Scenario: Edit
- **WHEN** the user presses Edit on their warning 12 of site 7
- **THEN** the app navigates to `/sites/7/warnings/12/edit`

#### Scenario: Delete confirmed
- **WHEN** the user presses Delete and then confirms
- **THEN** a delete request for the warning is sent and the warnings are requested again

#### Scenario: Delete cancelled
- **WHEN** the user presses Delete and then cancels
- **THEN** no delete request is sent

#### Scenario: Delete failed
- **WHEN** the delete request fails
- **THEN** the section shows an error alert and the warning stays

### Requirement: Admins hide warnings on the site page
A signed-in admin SHALL see a Hide button on every warning. Hide SHALL ask for confirmation,
then hide the warning and refresh the section. Other users SHALL see no Hide button.

#### Scenario: Admin hides
- **WHEN** an admin presses Hide on a warning and confirms
- **THEN** a hide request for the warning is sent and the warnings are requested again

#### Scenario: Hide cancelled
- **WHEN** an admin presses Hide and then cancels
- **THEN** no hide request is sent

#### Scenario: Not an admin
- **WHEN** a signed-in user who is not an admin opens the page
- **THEN** no warning has a Hide button
