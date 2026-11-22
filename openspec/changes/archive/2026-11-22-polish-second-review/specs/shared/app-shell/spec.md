## MODIFIED Requirements

### Requirement: The app shell shows toasts
The app shell SHALL hold one toast region that any page can add a toast to. A toast SHALL appear in a corner of the viewport inside
a `role="status"` live region, with an optional title, text, an optional link and a close button with a translated accessible name.
It SHALL close on its close button, or on its own after about 10 seconds; the timer SHALL pause while the pointer is over the toast or
focus is inside it. Several toasts SHALL stack. A toast SHALL stay in place when the page changes.

#### Scenario: Shown and announced
- **WHEN** a page adds a toast with the title "Achievement unlocked: First dive"
- **THEN** the text appears inside a `role="status"` region

#### Scenario: Stays long enough to read
- **WHEN** a toast has been shown for 9 seconds without hover or focus
- **THEN** it is still shown

#### Scenario: Closes on its own
- **WHEN** a toast has been shown for 10 seconds without hover or focus
- **THEN** it is gone

#### Scenario: Paused while hovered or focused
- **WHEN** the pointer is over a toast, or focus is on its link, when 10 seconds pass
- **THEN** it is still shown, and it closes about 10 seconds after the pointer or focus leaves

#### Scenario: Closed by hand
- **WHEN** the user presses a toast's close button
- **THEN** that toast is gone

#### Scenario: Two at once
- **WHEN** two toasts are added
- **THEN** both are shown, the newest last
