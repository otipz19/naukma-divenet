## MODIFIED Requirements

### Requirement: The certificates page manages the user's certificates
`/profile/certificates` SHALL need a signed-in user. It SHALL list their certificates with their status in the active language and
any rejection reason, with an "Add a certificate" button above the list and Edit and Delete on each item. Add and Edit SHALL open
the certificate form in a dialog, titled "Add a certificate" or with the certificate's agency and level. After saving, the dialog
SHALL close and the list SHALL be refreshed. Delete SHALL ask for confirmation in a confirmation dialog that names the certificate.
Editing a verified certificate SHALL show in the dialog, before saving, that it will need verifying again. The page SHALL show no
form outside the dialog. The profile's owner SHALL have a link to the page.

#### Scenario: Signed out
- **WHEN** a signed-out visitor opens the page
- **THEN** the login page is shown

#### Scenario: Listed
- **WHEN** the user has a verified and a rejected certificate
- **THEN** both show their status, and the rejected one its reason, and no certificate form is shown

#### Scenario: Added
- **WHEN** the user presses Add a certificate, fills in the dialog and saves
- **THEN** the request carries the values, the dialog is gone and the list is refreshed

#### Scenario: Form errors
- **WHEN** the user saves with no level or number
- **THEN** field errors in the active language are shown in the dialog and nothing is sent

#### Scenario: Edit warning
- **WHEN** the user presses Edit on a verified certificate
- **THEN** the dialog is titled with its agency and level, shows the warning, and sends the update request on save

#### Scenario: Delete
- **WHEN** the user presses Delete on a certificate and confirms
- **THEN** the confirmation named the certificate, the delete request is sent, and it leaves the list

#### Scenario: Delete not confirmed
- **WHEN** the user presses Delete on a certificate and cancels the confirmation
- **THEN** nothing is sent and it stays in the list

#### Scenario: Failed save
- **WHEN** the API answers 500
- **THEN** the dialog stays open with an alert and keeps the entered values
