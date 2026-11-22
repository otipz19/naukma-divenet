## Purpose

The safety disclaimer shown to a visitor in a dialog on their first visit, which they can
close and choose not to see again in this browser.

## ADDED Requirements

### Requirement: The disclaimer opens on a first visit
When the app loads in a browser that has not chosen "Don't show again", it SHALL open a
modal dialog on whatever page was opened. The dialog's title is translated, and it SHALL
show the safety disclaimer of the active language and the line "DiveNet · NaUKMA course
project". It SHALL open at most once per page load, and following links inside the app
SHALL NOT open it again.

#### Scenario: First visit
- **WHEN** the app is opened at `/` in a browser with empty storage and active language `en`
- **THEN** a modal dialog is shown that contains "Information on DiveNet is for reference only and does not replace dive planning according to your agency's standards."
- **AND** it contains "DiveNet · NaUKMA course project"

#### Scenario: Any page
- **WHEN** the app is opened at `/no-such-page` in a browser with empty storage
- **THEN** the disclaimer dialog is shown

#### Scenario: In Ukrainian
- **WHEN** the dialog opens with active language `uk`
- **THEN** its title, disclaimer and project line show the `uk` text

#### Scenario: Not again within the visit
- **WHEN** the user closes the dialog without "Don't show again" and follows the Feed link
- **THEN** no disclaimer dialog is shown

### Requirement: The disclaimer can be closed and not shown again
The dialog SHALL close on its close button, on its "Got it" button and on Escape, and
focus SHALL then go to the main landmark. It SHALL have a "Don't show again" checkbox,
which is not checked at first. Closing it with the box checked SHALL save that choice in
this browser, so later page loads do not open it. Closing it with the box unchecked SHALL
save nothing.

#### Scenario: Closed with the box unchecked
- **WHEN** the user closes the dialog with the box unchecked and reloads the page
- **THEN** the disclaimer dialog is shown again

#### Scenario: Don't show again
- **WHEN** the user checks "Don't show again", presses "Got it" and reloads the page
- **THEN** no disclaimer dialog is shown

#### Scenario: Escape
- **WHEN** the dialog is open and the user presses Escape
- **THEN** the dialog is gone and focus is on the main landmark

### Requirement: Storage failures never break the disclaimer
When browser storage cannot be read or written, the app SHALL still start and treat the
choice as not saved: the dialog opens, and closing it works.

#### Scenario: Storage throws
- **WHEN** reading and writing storage throw and the app is opened
- **THEN** the disclaimer dialog is shown
- **AND** checking "Don't show again" and pressing "Got it" closes it without an error
