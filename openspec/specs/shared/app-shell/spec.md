# shared/app-shell Specification

## Purpose
Provides the frame around every page of the web app: the header with navigation
and the language switch, the footer with the safety disclaimer, the colour theme
and the fonts, so every feature page looks and behaves the same way.

## Requirements

### Requirement: Every page renders inside the app shell
Every route SHALL render inside one layout made of a header landmark, a single
main landmark holding the page content, and a footer landmark, in that order.

#### Scenario: Home page has the shell
- **WHEN** the app is opened at `/`
- **THEN** the page has exactly one banner, one main and one contentinfo landmark
- **AND** the page content is inside the main landmark

#### Scenario: Not-found page has the shell
- **WHEN** the app is opened at `/no-such-page`
- **THEN** the page has the banner, main and contentinfo landmarks
- **AND** the not-found message is inside the main landmark

### Requirement: A skip link leads past the header
The first focusable element of every page SHALL be a translated "Skip to content"
link that moves focus to the main landmark.

#### Scenario: Skip to content
- **WHEN** the user presses Tab once on a freshly loaded page and activates the focused link
- **THEN** the focused link was the skip link of the active locale
- **AND** focus is then on the main landmark

### Requirement: The header shows the wordmark and the main navigation
The header SHALL show the wordmark "DiveNet" as a link to `/` and a labelled
main navigation. The navigation SHALL list the entries registered by features;
the shell itself registers Map, linking to `/`. Entry labels SHALL come from the
active locale.

#### Scenario: Wordmark and Map entry
- **WHEN** the app is opened at `/`
- **THEN** the header has a link named "DiveNet" whose target is `/`
- **AND** a navigation landmark named by the active locale contains a link "Map" whose target is `/`

#### Scenario: Navigation in Ukrainian
- **WHEN** the app is opened at `/` with active locale `uk`
- **THEN** the Map entry and the navigation's name show the `uk` text

### Requirement: The current page is marked in the navigation
The navigation entry whose target matches the current path SHALL carry
`aria-current="page"`, and no other entry SHALL carry it.

#### Scenario: Map is current on the home page
- **WHEN** the app is opened at `/`
- **THEN** the Map entry has `aria-current="page"`

#### Scenario: No entry is current on an unknown path
- **WHEN** the app is opened at `/no-such-page`
- **THEN** no navigation entry has `aria-current`

### Requirement: The header has a language switch
The header SHALL contain a labelled group of two toggle buttons, "EN" and "UK",
in both locales. The button of the active locale SHALL be pressed and the other
not. Pressing a button SHALL make its locale active, which saves the choice and
updates the document language as `shared/i18n` requires.

#### Scenario: Active locale is pressed
- **WHEN** the app is opened with active locale `en`
- **THEN** the "EN" button is pressed and the "UK" button is not

#### Scenario: Switch to Ukrainian
- **WHEN** the user presses the "UK" button
- **THEN** the page text, including the header and footer, shows the `uk` text
- **AND** the "UK" button is pressed
- **AND** the saved language choice is `uk`
- **AND** the `<html>` element has `lang="uk"`

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

### Requirement: The footer shows the safety disclaimer
The footer SHALL show the safety disclaimer of the active locale, led by a bold
"Safety:" label, followed by a meta line with the project name and the map-data
attribution. The disclaimer SHALL have no control that hides or dismisses it.

#### Scenario: Disclaimer in English
- **WHEN** the app is opened at `/` with active locale `en`
- **THEN** the footer contains "Information on DiveNet is for reference only and does not replace dive planning according to your agency's standards."
- **AND** it contains "Map data © OpenStreetMap contributors"
- **AND** the footer contains no button

#### Scenario: Disclaimer in Ukrainian
- **WHEN** the app is opened at `/` with active locale `uk`
- **THEN** the footer shows the `uk` text of the disclaimer and the meta line

#### Scenario: Disclaimer on every page
- **WHEN** the app is opened at `/no-such-page`
- **THEN** the footer shows the safety disclaimer

### Requirement: The colour theme follows the system preference
On start, the app SHALL set `data-theme` on the `<html>` element to `dark` when
the system prefers a dark colour scheme and to `light` otherwise. While the page
is open, it SHALL update the attribute when the preference changes.

#### Scenario: Light system
- **WHEN** the app starts and the system does not prefer a dark colour scheme
- **THEN** the `<html>` element has `data-theme="light"`

#### Scenario: Dark system
- **WHEN** the app starts and the system prefers a dark colour scheme
- **THEN** the `<html>` element has `data-theme="dark"`

#### Scenario: Preference changes while open
- **WHEN** the app is running in the light theme and the system preference changes to dark
- **THEN** the `<html>` element has `data-theme="dark"`

### Requirement: Fonts are self-hosted
The production build SHALL contain the font files for the heading, text and data
type families, including Cyrillic glyphs, and SHALL NOT reference any third-party
font host.

#### Scenario: Build bundles the fonts
- **WHEN** the gate checks the front-end production build
- **THEN** the output contains font files for Manrope, Golos Text and JetBrains Mono, each with a Cyrillic subset
- **AND** no output file references `fonts.googleapis.com` or `fonts.gstatic.com`
