# Spec Delta

## MODIFIED Requirements

### Requirement: The header shows the wordmark and the main navigation
The header SHALL show the wordmark "DiveNet" as a link to `/` and a labelled
main navigation. The navigation SHALL list the entries registered by features;
the shell itself registers Map, linking to `/`. An entry MAY be limited to the
admin or hidden from the admin, and SHALL then be shown only to the visitors it
is for, in the header and in the drawer. Entry labels SHALL come from the
active locale.

#### Scenario: Wordmark and Map entry
- **WHEN** the app is opened at `/`
- **THEN** the header has a link named "DiveNet" whose target is `/`
- **AND** a navigation landmark named by the active locale contains a link "Map" whose target is `/`

#### Scenario: Navigation in Ukrainian
- **WHEN** the app is opened at `/` with active locale `uk`
- **THEN** the Map entry and the navigation's name show the `uk` text

#### Scenario: Admin navigation
- **WHEN** the app is opened with a session for a user with role `ADMIN`
- **THEN** the main navigation lists Map, Feed and Moderation, in that order
- **AND** it has no Dive log entry

#### Scenario: Diver navigation
- **WHEN** the app is opened with a session for a user with role `USER`
- **THEN** the main navigation lists Map, Feed and Dive log
- **AND** it has no Moderation entry

### Requirement: The header shows the account area
After the language switch, the header SHALL show the account area. Signed out,
it SHALL show a "Log in" link to `/login` and a "Sign up" link to `/register`
styled as the primary button. Signed in, it SHALL show a button with the user's
initials, named by the display name, that opens a menu. The menu SHALL show the
display name and a "Log out" item, and, for a user with role `USER`, a "Profile"
item linking to their profile. While the session is being restored on load, the
area SHALL show neither state.

#### Scenario: Signed out
- **WHEN** the app is opened with no session
- **THEN** the header has a link "Log in" to `/login` and a link "Sign up" to `/register`

#### Scenario: Signed in
- **WHEN** the app is opened with a session for the display name "Mira Koval"
- **THEN** the header has a button showing "MK" whose accessible name contains "Mira Koval"
- **AND** there is no "Log in" link

#### Scenario: Account menu
- **WHEN** a signed-in user presses the account button
- **THEN** the button has `aria-expanded="true"`
- **AND** a menu shows the display name and a "Log out" item
- **AND** pressing Escape closes the menu and returns focus to the button

#### Scenario: Admin account menu
- **WHEN** a user with role `ADMIN` opens the account menu
- **THEN** its only item is "Log out", after the display name
- **AND** it has no "Profile" and no "Moderation" item

#### Scenario: Account area in Ukrainian
- **WHEN** the app is opened with no session and active locale `uk`
- **THEN** the "Log in" and "Sign up" links show the `uk` text

### Requirement: Narrow screens use a navigation drawer
Below 768 px the header SHALL replace the inline navigation, language switch and
account area with a menu button that opens a drawer holding the navigation, then
the language switch, then the account links: "Log in" and "Sign up"; or the
display name, "Profile" for a user with role `USER`, and "Log out". The button
SHALL carry a translated name and `aria-expanded`. The drawer SHALL close on its
close button, on Escape and when a navigation or account link in it is followed.

#### Scenario: Open the drawer
- **WHEN** the user presses the menu button
- **THEN** the menu button has `aria-expanded="true"`
- **AND** a dialog named by the active locale shows the navigation entries and the language switch

#### Scenario: Close with Escape
- **WHEN** the drawer is open and the user presses Escape
- **THEN** the dialog is gone
- **AND** the menu button has `aria-expanded="false"` and has focus

#### Scenario: Close by following a link
- **WHEN** the drawer is open and the user follows the Map entry in it
- **THEN** the dialog is gone and the page at `/` is shown

#### Scenario: Account links in the drawer
- **WHEN** the drawer is open with no session
- **THEN** the dialog has a "Log in" link to `/login` and a "Sign up" link to `/register`
- **AND** following "Log in" closes the dialog and shows the login page

#### Scenario: Log out from the drawer
- **WHEN** the drawer is open for a signed-in user and the user chooses "Log out"
- **THEN** the dialog is gone and the dialog's account links show "Log in" when it is opened again

#### Scenario: Admin drawer
- **WHEN** the drawer is open for a user with role `ADMIN`
- **THEN** its navigation has the Moderation entry
- **AND** its account links have no "Profile" and no "Moderation" link
