# Spec Delta

## ADDED Requirements

### Requirement: The header shows the account area
After the language switch, the header SHALL show the account area. Signed out,
it SHALL show a "Log in" link to `/login` and a "Sign up" link to `/register`
styled as the primary button. Signed in, it SHALL show a button with the user's
initials, named by the display name, that opens a menu. The menu SHALL show the
display name and a "Log out" item. While the session is being restored on load,
the area SHALL show neither state.

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

#### Scenario: Account area in Ukrainian
- **WHEN** the app is opened with no session and active locale `uk`
- **THEN** the "Log in" and "Sign up" links show the `uk` text

## MODIFIED Requirements

### Requirement: Narrow screens use a navigation drawer
Below 768 px the header SHALL replace the inline navigation, language switch and
account area with a menu button that opens a drawer holding the navigation, then
the language switch, then the account links ("Log in" and "Sign up", or the
display name and "Log out"). The button SHALL carry a translated name and
`aria-expanded`. The drawer SHALL close on its close button, on Escape and when
a navigation or account link in it is followed.

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
