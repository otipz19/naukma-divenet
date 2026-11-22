## ADDED Requirements

### Requirement: The map fills the viewport below the header
The map page SHALL fill the viewport height below the header at every width, and the
page itself SHALL NOT scroll. On a desktop only the side panel's body scrolls. On a
phone only the expanded results sheet scrolls.

#### Scenario: Desktop
- **WHEN** `/` is opened on a 1440×900 viewport with twenty sites
- **THEN** the document's scroll height equals the viewport height
- **AND** the map's bottom edge is at the viewport's bottom edge

#### Scenario: Phone
- **WHEN** `/` is opened on a 390×844 viewport with twenty sites
- **THEN** the document's scroll height equals the viewport height

### Requirement: The map offers adding a site
The map SHALL show a floating "Add a site" link in a corner of the map, linking to
`/sites/new`. It SHALL NOT be in the search panel, and it SHALL be shown to visitors and
to signed-in users.

#### Scenario: Link on the map
- **WHEN** a visitor opens `/`
- **THEN** the map region holds a link "Add a site" whose target is `/sites/new`
- **AND** the search panel holds no link to `/sites/new`

#### Scenario: In Ukrainian
- **WHEN** `/` is opened with active language `uk`
- **THEN** the link shows the `uk` text
