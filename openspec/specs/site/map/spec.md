# site/map Specification

## Purpose

Defines the world map at the root path, which lets divers discover sites by panning,
zooming and opening clustered markers.

## Requirements

### Requirement: The root path shows a world map of sites
`/` SHALL render a pannable, zoomable map with one marker per site from the markers
endpoint, and SHALL credit OpenStreetMap.

#### Scenario: Map loads
- **WHEN** the app is opened at `/` and the API returns three sites
- **THEN** the map holds three markers
- **AND** the OpenStreetMap attribution is shown

### Requirement: Nearby markers cluster
Markers SHALL be grouped in a cluster layer, so that markers that are close together at
the current zoom appear as one cluster showing their count.

#### Scenario: Close markers at a low zoom
- **WHEN** two sites a few metres apart are shown at the lowest zoom
- **THEN** they appear as one cluster with the count 2

### Requirement: A marker opens a summary that links to the site
Clicking a marker SHALL open a popup with the site's name as a link to `/sites/{id}`, its
country and region in the active language, its difficulty as a word, and its depth range.

#### Scenario: Marker clicked
- **WHEN** a user clicks the marker of a Dahab site with id 7, difficulty 1 and depths 3 to 18
- **THEN** a popup shows the site's name linking to `/sites/7`
- **AND** it shows "Egypt · Dahab", "Beginner" and "3–18 m"

#### Scenario: Summary in Ukrainian
- **WHEN** the active language is `uk` and the same marker is clicked
- **THEN** the country, region and difficulty use the `uk` text

### Requirement: Difficulty is shown as a word
The UI SHALL show a declared difficulty as a word: 1 is Beginner, 2 and 3 are
Intermediate, 4 is Advanced and 5 is Technical.

#### Scenario: Each level maps to a word
- **WHEN** difficulties 1, 2, 3, 4 and 5 are shown
- **THEN** the words are Beginner, Intermediate, Intermediate, Advanced and Technical

### Requirement: The map page reports a failed load
When the markers cannot be loaded, the page SHALL show an error message in place of
silently showing an empty map.

#### Scenario: API error
- **WHEN** the markers endpoint returns a 500
- **THEN** the page shows an alert with the error text of the active language
