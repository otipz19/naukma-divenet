# site/details Specification

## Purpose

Defines the site page, which gives divers the facts they need to judge whether a site
suits them, together with the safety disclaimer.

## Requirements

### Requirement: The site page shows the site's facts
`/sites/:id` SHALL show the site's name, coordinates, country and region, declared
difficulty, depth range, description, and required and recommended gear. Country, region,
difficulty and gear names SHALL use the active language.

#### Scenario: Site page renders
- **WHEN** a user opens the page of a site in `eg-dahab` that requires `torch`
- **THEN** the page has a level-one heading with the site's name
- **AND** it shows the coordinates in the form "28.5722° N, 34.5375° E", "Egypt, Dahab", the difficulty word, the depth range, the description and "Torch"

#### Scenario: Southern and western coordinates
- **WHEN** a site is at latitude -8.5 and longitude -80.25
- **THEN** its coordinates read "8.5000° S, 80.2500° W"

#### Scenario: Gear in Ukrainian
- **WHEN** the active language is `uk`
- **THEN** the country, region, difficulty and gear use the `uk` text

#### Scenario: Site with no gear
- **WHEN** a site has no required and no recommended gear
- **THEN** neither gear heading is shown

### Requirement: The site page shows the safety disclaimer
The site page SHALL show the safety disclaimer of the active language in a box of its
own, in addition to the footer, and the box SHALL NOT be dismissible.

#### Scenario: Disclaimer box
- **WHEN** a user opens a site page
- **THEN** the main content holds an alert with the disclaimer text and no dismiss control

### Requirement: The site page links back to the map
The site page SHALL show a breadcrumb with a link to `/`, followed by the country,
region and site name.

#### Scenario: Breadcrumb
- **WHEN** a user opens a site page
- **THEN** a breadcrumb navigation has a link whose target is `/`

### Requirement: The site page handles a missing site and a failed load
An unknown site id SHALL show a not-found message with a link to `/`. Any other failed
load SHALL show an error alert.

#### Scenario: Unknown site
- **WHEN** the API answers 404 for the requested site
- **THEN** the page shows the not-found message and a link whose target is `/`

#### Scenario: API error
- **WHEN** the API answers 500 for the requested site
- **THEN** the page shows an alert with the error text of the active language

### Requirement: The site page shows an unapproved site's status
For a pending or rejected site, the page SHALL show a notice with the status in the active
language and any rejection reason. An approved site SHALL show no such notice.

#### Scenario: Pending site
- **WHEN** the author opens a pending site's page
- **THEN** the page shows the pending notice

#### Scenario: Rejected site
- **WHEN** the author opens a rejected site's page
- **THEN** the page shows the rejected notice with the reason

#### Scenario: Approved site
- **WHEN** a visitor opens an approved site's page
- **THEN** no status notice is shown

### Requirement: The site page waits for the session
The page SHALL request the site only after the session has been restored, so an author who
reloads their own unapproved site's page is not shown the not-found message.

#### Scenario: Reload by the author
- **WHEN** a signed-in author reloads a pending site's page
- **THEN** the site request carries the access token and the page shows the site
