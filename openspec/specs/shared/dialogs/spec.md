# shared/dialogs Specification

## Purpose
Defines how every modal dialog in the web app behaves: opening over an inert page, its title as its name,
closing by Escape or its close button with focus returned to the opener, asking before unsaved changes are
discarded, and confirming a destructive action before it runs.

## Requirements

### Requirement: A dialog is modal and named by its title
A dialog SHALL open as a modal over the page, built on the native `<dialog>` element opened with `showModal()`, and SHALL be named
by its visible title. While it is open, the page behind it SHALL not take focus or clicks. On a viewport narrower than `bp-md` it
SHALL fill the screen.

#### Scenario: Opened
- **WHEN** a dialog titled "Log a dive" opens
- **THEN** a modal dialog named "Log a dive" is shown, and focus is inside it

#### Scenario: The page behind is inert
- **WHEN** a dialog is open and the user presses Tab repeatedly
- **THEN** focus stays on controls inside the dialog

#### Scenario: Phone width
- **WHEN** a dialog opens on a 390 px wide viewport
- **THEN** it covers the whole viewport

### Requirement: A dialog closes and returns focus
A dialog SHALL close on Escape and on its close button, whose accessible name is translated. When it closes, focus SHALL return
to the control that opened it. A dialog SHALL NOT close on a click outside it.

#### Scenario: Escape
- **WHEN** a dialog is open and the user presses Escape
- **THEN** the dialog is gone and focus is on the button that opened it

#### Scenario: Close button
- **WHEN** the user presses the dialog's close button
- **THEN** the dialog is gone and focus is on the button that opened it

#### Scenario: Click outside
- **WHEN** the user clicks the backdrop outside the dialog
- **THEN** the dialog stays open

### Requirement: Closing a form with unsaved changes asks first
A dialog holding a form SHALL, when it would close by Escape, its close button or Cancel while the form has unsaved changes, ask
whether to discard them. Discarding SHALL close it; keeping SHALL leave it open with the values. A form without changes SHALL close
at once.

#### Scenario: Unsaved changes discarded
- **WHEN** the user changes a field and presses Escape, then chooses Discard
- **THEN** the dialog is gone and nothing is sent

#### Scenario: Unsaved changes kept
- **WHEN** the user changes a field and presses Escape, then chooses Keep editing
- **THEN** the dialog stays open with the changed value

#### Scenario: No changes
- **WHEN** the user opens a form dialog and presses Escape without changing anything
- **THEN** the dialog is gone without a question

### Requirement: A confirmation dialog asks before a destructive action
A confirmation dialog SHALL name the item it acts on in its question and offer a confirming button and Cancel; focus SHALL start on
Cancel. Only the confirming button SHALL carry out the action.

#### Scenario: Confirmed
- **WHEN** a confirmation dialog asks "Delete the dive at SS Thistlegorm on 12 Mar 2026?" and the user presses Delete
- **THEN** the action runs and the dialog is gone

#### Scenario: Cancelled
- **WHEN** the user presses Cancel or Escape in a confirmation dialog
- **THEN** the action does not run and the dialog is gone

#### Scenario: Initial focus
- **WHEN** a confirmation dialog opens
- **THEN** Cancel has focus
