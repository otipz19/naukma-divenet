# Spec Delta

## MODIFIED Requirements

### Requirement: The moderation page is for admins
`/admin/moderation` SHALL show admins the queue. Other visitors SHALL see the not-found page, or
the login page when signed out. The main navigation SHALL have a Moderation entry to it for admins
only, after Map and Feed, marked current on `/admin/moderation`. The entry SHALL show a badge with
the number of pending items, sites and certificates together, and no badge when nothing is pending.
The count SHALL follow approvals, rejections and verifications without a reload. The account menu
SHALL NOT link to the page.

#### Scenario: Signed-in user who is not an admin
- **WHEN** a user with role `USER` opens the page
- **THEN** the not-found page is shown and the queue is not requested

#### Scenario: Navigation entry
- **WHEN** an admin opens any page while 2 sites and 1 certificate are pending
- **THEN** the main navigation has a Moderation link to `/admin/moderation` with a badge "3"

#### Scenario: Account menu
- **WHEN** an admin opens the account menu
- **THEN** it has no link to `/admin/moderation`

#### Scenario: Current page
- **WHEN** an admin opens `/admin/moderation`
- **THEN** the Moderation entry has `aria-current="page"`

#### Scenario: Count follows moderation
- **WHEN** the admin approves one of 3 pending items on the moderation page
- **THEN** the Moderation entry's badge shows "2"

#### Scenario: Nothing pending
- **WHEN** an admin opens any page and the queues are empty
- **THEN** the Moderation entry shows no badge

#### Scenario: Not for divers
- **WHEN** a user with role `USER` opens any page
- **THEN** neither the main navigation nor the account menu links to `/admin/moderation`
