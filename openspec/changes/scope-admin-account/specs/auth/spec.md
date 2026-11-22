# Spec Delta

## ADDED Requirements

### Requirement: The web app shows the admin no diver actions
For a signed-in user with role `ADMIN`, the web app SHALL hide every action that creates
diver content:
- "Log a dive here" and "Write a review" on a site page;
- "Report a warning" on a site page;
- "Add a site" on the map;
- "Write a post" and the drafts list on the feed.

The admin SHALL still see all public content and SHALL keep "Hide" on warnings. This rule
covers only the web app: the API does not refuse an admin.

#### Scenario: Site page for an admin
- **WHEN** an admin opens the page of an approved site
- **THEN** it has no "Log a dive here", "Write a review" or "Report a warning" link
- **AND** each warning still has a "Hide" action

#### Scenario: Site page for a diver
- **WHEN** a user with role `USER` opens the page of an approved site
- **THEN** it has the "Log a dive here", "Write a review" and "Report a warning" links

#### Scenario: Map for an admin
- **WHEN** an admin opens `/`
- **THEN** the map has no "Add a site" link

#### Scenario: Feed for an admin
- **WHEN** an admin opens `/feed`
- **THEN** the page has no "Write a post" link and no drafts list

### Requirement: Diver pages send the admin to moderation
When a signed-in admin opens a diver page, the web app SHALL replace the page with
`/admin/moderation`. The diver pages are `/dive-log`, `/posts/new`, `/posts/:id/edit`,
`/sites/new`, `/sites/:id/review`, `/sites/:id/warnings/new`,
`/sites/:id/warnings/:warningId/edit`, `/profile/edit` and `/profile/certificates`. The
page SHALL NOT request its own data first. A signed-out visitor SHALL still go to the
login page.

#### Scenario: Admin opens the dive log
- **WHEN** an admin opens `/dive-log`
- **THEN** the moderation page is shown at `/admin/moderation`
- **AND** the dive log is not requested

#### Scenario: Admin opens the post editor
- **WHEN** an admin opens `/posts/new`
- **THEN** the moderation page is shown at `/admin/moderation`

#### Scenario: Diver opens the dive log
- **WHEN** a user with role `USER` opens `/dive-log`
- **THEN** the dive log page is shown

#### Scenario: Signed out
- **WHEN** a signed-out visitor opens `/sites/new`
- **THEN** the login page is shown

### Requirement: The admin has no profile in the web app
The web app SHALL NOT link a signed-in admin to their own profile. When the admin opens
`/users/<their own id>`, the web app SHALL show the not-found page. Other profiles SHALL
stay readable to the admin as to any visitor.

#### Scenario: Own profile
- **WHEN** an admin opens `/users/<the admin's id>`
- **THEN** the not-found page is shown

#### Scenario: Another diver's profile
- **WHEN** an admin opens the profile of a user with role `USER`
- **THEN** that profile is shown, with no "Edit profile" link
