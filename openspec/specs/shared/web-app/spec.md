# shared/web-app Specification

## Purpose
Provides the single-page web app that every UI feature plugs into: it boots in the
browser, maps URLs to pages and gives all pages one shared server-state cache.

## Requirements

### Requirement: The app serves a placeholder home page
Until the app shell is designed, the root path `/` SHALL render an unstyled
placeholder page that shows the product name and a short notice, both taken from
the active locale.

#### Scenario: Home page renders
- **WHEN** the app is opened at `/`
- **THEN** the page shows a top-level heading with the product name "DiveNet"
- **AND** it shows the placeholder notice text of the active locale

### Requirement: Unknown paths show a not-found page
Any path that no route matches SHALL render a not-found page with a translated
message and a link back to `/`. The page SHALL NOT be blank and SHALL NOT throw.

#### Scenario: Unknown path
- **WHEN** the app is opened at `/no-such-page`
- **THEN** the page shows the not-found message of the active locale
- **AND** it shows a link whose target is `/`

#### Scenario: Link returns home
- **WHEN** the user follows the link on the not-found page
- **THEN** the home page is shown

### Requirement: Pages share one server-state cache
The app SHALL provide a single server-state cache to every page, so data that one
page fetched is reused by another without a new request while it is fresh.

#### Scenario: Cached data is reused
- **WHEN** two components under the app root request the same query key one after the other
- **THEN** the API receives exactly one request for it

### Requirement: The production build succeeds
The front-end SHALL produce a static production build, and the quality gate SHALL
fail when the build fails.

#### Scenario: Gate builds the app
- **WHEN** the quality gate runs on a front-end that compiles
- **THEN** the build step writes `frontend/dist/index.html` and passes
