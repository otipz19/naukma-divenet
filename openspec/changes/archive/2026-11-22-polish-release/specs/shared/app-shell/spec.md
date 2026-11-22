# Spec Delta

## MODIFIED Requirements

### Requirement: Narrow screens use a navigation drawer
Below 768 px a menu button SHALL replace the inline navigation, language switch,
theme switch and account area. It opens a drawer with the navigation, the language
switch, the theme switch and the account links: "Log in" and "Sign up", or the
display name, "Profile" (role `USER` only) and "Log out". The button SHALL carry a
translated name and `aria-expanded`. The drawer SHALL close on its close button, on
Escape and when a link in it is followed.

#### Scenario: Open the drawer
- **WHEN** the user presses the menu button
- **THEN** the menu button has `aria-expanded="true"`
- **AND** a dialog named by the active locale shows the navigation entries, the language switch and the theme switch

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

#### Scenario: Theme from the drawer
- **WHEN** the drawer is open and the user presses "Dark" in it
- **THEN** the `<html>` element has `data-theme="dark"`
- **AND** the drawer is still open

### Requirement: The colour theme follows the system preference
The colour theme SHALL follow the saved theme choice: `light` or `dark` sets that
value as `data-theme` on the `<html>` element. With no saved choice, or the choice
`system`, the app SHALL set `data-theme` to `dark` when the system prefers a dark
colour scheme and to `light` otherwise, and SHALL update it when the preference
changes while the page is open.

#### Scenario: Light system
- **WHEN** the app starts with no saved theme choice and the system does not prefer a dark colour scheme
- **THEN** the `<html>` element has `data-theme="light"`

#### Scenario: Dark system
- **WHEN** the app starts with no saved theme choice and the system prefers a dark colour scheme
- **THEN** the `<html>` element has `data-theme="dark"`

#### Scenario: Preference changes while open
- **WHEN** the app is running with the choice `system` in the light theme and the system preference changes to dark
- **THEN** the `<html>` element has `data-theme="dark"`

#### Scenario: Saved choice wins over the system
- **WHEN** the app starts with the saved choice `light` and the system prefers a dark colour scheme
- **THEN** the `<html>` element has `data-theme="light"`
- **AND** it stays `light` when the system preference changes

#### Scenario: Unknown saved value
- **WHEN** the app starts with a saved theme value that is not `system`, `light` or `dark`
- **THEN** the theme follows the system preference

## ADDED Requirements

### Requirement: The header has a theme switch
After the language switch, the header SHALL contain a labelled group of three
toggle buttons: System, Light and Dark. Each button SHALL have a translated
accessible name and an icon. The button of the current choice SHALL be pressed;
with no saved choice, that is System. Pressing a button SHALL apply that theme at
once and save the choice in the browser, so it holds after a reload.

#### Scenario: System is the default
- **WHEN** the app is opened with no saved theme choice
- **THEN** the header's theme group, named by the active locale, has System pressed and Light and Dark not pressed

#### Scenario: Pick dark
- **WHEN** the user presses "Dark" while the system prefers light
- **THEN** the `<html>` element has `data-theme="dark"` and "Dark" is pressed
- **AND** after a reload the `<html>` element still has `data-theme="dark"` and "Dark" is pressed

#### Scenario: Back to system
- **WHEN** the user who chose "Dark" presses "System" while the system prefers light
- **THEN** the `<html>` element has `data-theme="light"` and "System" is pressed
- **AND** it follows the system preference again

#### Scenario: Theme switch in Ukrainian
- **WHEN** the app is opened with active locale `uk`
- **THEN** the theme group's name and its three buttons' names show the `uk` text
