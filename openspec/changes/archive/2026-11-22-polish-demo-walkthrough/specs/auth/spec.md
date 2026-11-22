# Spec Delta

## ADDED Requirements

### Requirement: Diver actions ask a visitor to log in
For a signed-out visitor, the actions "Log a dive here", "Write a review", "Report a warning"
and "Add a site" SHALL open a dialog instead of navigating. The dialog SHALL say that the action
needs an account and offer "Log in" and "Cancel". Each action SHALL stay a link to its page.

#### Scenario: Visitor presses an action
- **WHEN** a signed-out visitor presses "Write a review" on site 7's page
- **THEN** a dialog opens saying they must log in to write a review, with "Log in" and "Cancel"
- **AND** the URL is still site 7's page

#### Scenario: Each action names itself
- **WHEN** a signed-out visitor presses "Log a dive here", "Report a warning" or "Add a site"
- **THEN** the dialog's text names that action, in the active language

#### Scenario: Cancel
- **WHEN** the visitor presses "Cancel" or Escape in the dialog
- **THEN** the dialog closes, the page stays, and focus returns to the action

#### Scenario: Signed-in diver
- **WHEN** a signed-in diver presses "Write a review" on site 7's page
- **THEN** no dialog opens and the review form at `/sites/7/review` is shown

### Requirement: Logging in from the dialog returns to the action
The dialog's "Log in" SHALL open the login page, which after a successful login SHALL go to the
page of the action the visitor chose. Opening that page's URL directly while signed out SHALL
keep redirecting to the login page as before.

#### Scenario: Log in and continue
- **WHEN** the visitor presses "Log in" in the dialog opened by "Write a review" on site 7 and then logs in
- **THEN** the review form at `/sites/7/review` is shown

#### Scenario: Add a site after login
- **WHEN** the visitor presses "Log in" in the dialog opened by "Add a site" and then logs in
- **THEN** the submission page at `/sites/new` is shown

#### Scenario: Direct URL keeps the redirect
- **WHEN** a signed-out visitor opens `/sites/7/review` directly
- **THEN** the login page is shown, and logging in returns to `/sites/7/review`
