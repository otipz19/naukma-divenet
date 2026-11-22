# shared/app-shell Specification

## Purpose
Provides the frame around every page of the web app: the header with navigation
and the language switch, the footer with the safety disclaimer, the colour theme
and the fonts, so every feature page looks and behaves the same way.

## Requirements

### Requirement: Every page renders inside the app shell
Every route SHALL render inside one layout made of a header landmark followed by a
single main landmark holding the page content. The layout SHALL have no footer
landmark.

#### Scenario: Home page has the shell
- **WHEN** the app is opened at `/`
- **THEN** the page has exactly one banner and one main landmark, and no contentinfo landmark
- **AND** the page content is inside the main landmark

#### Scenario: Not-found page has the shell
- **WHEN** the app is opened at `/no-such-page`
- **THEN** the page has the banner and main landmarks
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
- **THEN** the page text, including the header, shows the `uk` text
- **AND** the "UK" button is pressed
- **AND** the saved language choice is `uk`
- **AND** the `<html>` element has `lang="uk"`

### Requirement: The header shows the account area
After the language switch, the header SHALL show the account area. Signed out,
it SHALL show a "Log in" link to `/login` and a "Sign up" link to `/register`
styled as the primary button. Signed in, it SHALL show a button with the user's
initials, named by the display name, that opens a menu with the display name, a
"Log out" item and, for role `USER` only, a "Profile" item linking to their
profile. While the session is being restored on load, the area SHALL show
neither state.

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

### Requirement: Fonts are self-hosted
The production build SHALL contain the font files for the heading, text and data
type families, including Cyrillic glyphs, and SHALL NOT reference any third-party
font host.

#### Scenario: Build bundles the fonts
- **WHEN** the gate checks the front-end production build
- **THEN** the output contains font files for Manrope, Golos Text and JetBrains Mono, each with a Cyrillic subset
- **AND** no output file references `fonts.googleapis.com` or `fonts.gstatic.com`

### Requirement: Controls are large enough to touch on phones

Below `bp-md`, buttons, chips and icon buttons SHALL be at least `--touch-target` (44 px) tall, and icon buttons at least as wide, as the design's accessibility rule asks.

#### Scenario: Shared controls
- **WHEN** the stylesheets of the Button and Chip components are checked
- **THEN** each sets a minimum height of `var(--touch-target)` below `bp-md`

#### Scenario: Token
- **WHEN** the generated tokens are read
- **THEN** `--touch-target` is 44 px

### Requirement: The app shell shows toasts
The app shell SHALL hold one toast region that any page can add a toast to. A toast SHALL appear in a corner of the viewport inside
a `role="status"` live region, with an optional title, text, an optional link and a close button with a translated accessible name.
It SHALL close on its close button, or on its own after about 6 seconds; the timer SHALL pause while the pointer is over the toast or
focus is inside it. Several toasts SHALL stack. A toast SHALL stay in place when the page changes.

#### Scenario: Shown and announced
- **WHEN** a page adds a toast with the title "Achievement unlocked: First dive"
- **THEN** the text appears inside a `role="status"` region

#### Scenario: Closes on its own
- **WHEN** a toast has been shown for 6 seconds without hover or focus
- **THEN** it is gone

#### Scenario: Paused while hovered or focused
- **WHEN** the pointer is over a toast, or focus is on its link, when 6 seconds pass
- **THEN** it is still shown, and it closes about 6 seconds after the pointer or focus leaves

#### Scenario: Closed by hand
- **WHEN** the user presses a toast's close button
- **THEN** that toast is gone

#### Scenario: Two at once
- **WHEN** two toasts are added
- **THEN** both are shown, the newest last

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
