# Spec Delta

## ADDED Requirements

### Requirement: A page that crashes shows an error page
When a page throws while it renders, the app SHALL show an error page inside the
app shell instead of a blank screen. The page SHALL show a translated heading and
text, a "Reload page" button that reloads the current URL and a link to `/`. It
SHALL NOT show the technical error message. The header SHALL stay usable, and
going to another page SHALL show that page.

#### Scenario: Crash shows the error page
- **WHEN** a route's page throws an error "boom" while rendering
- **THEN** the page has the banner and main landmarks
- **AND** the main landmark shows the error heading of the active locale, a "Reload page" button and a link whose target is `/`
- **AND** the text "boom" is not shown

#### Scenario: Leave the error page
- **WHEN** the error page is shown and the user follows the Feed entry in the header
- **THEN** the feed page is shown

#### Scenario: Error page in Ukrainian
- **WHEN** a page crashes with active locale `uk`
- **THEN** the error heading, text, button and link show the `uk` text

### Requirement: Main pages show a loading placeholder
While its main data loads, each of the map results list and the site, feed, post,
profile, dive log, certificates and moderation pages SHALL show a placeholder in
place of its content. The placeholder region SHALL carry `aria-busy="true"` and a
translated "Loading" status. Content or an error message SHALL replace it once the
request settles. When reduced motion is requested, the placeholder SHALL NOT
animate.

#### Scenario: Site page while loading
- **WHEN** the site page is opened and the site request has not answered yet
- **THEN** the main landmark has a region with `aria-busy="true"` and a status reading "Loading" in the active locale
- **AND** once the site arrives the region is gone and the site name is shown

#### Scenario: Every main page has a placeholder
- **WHEN** each of the map results list and the feed, post, profile, dive log, certificates and moderation pages is opened while its main request has not answered yet
- **THEN** it shows a region with `aria-busy="true"` and the "Loading" status

#### Scenario: Placeholder after a failed request
- **WHEN** the feed request fails
- **THEN** the placeholder is gone and the feed's error message is shown

#### Scenario: Reduced motion
- **WHEN** the Skeleton component's stylesheet is checked
- **THEN** it turns its animation off under `prefers-reduced-motion: reduce`

### Requirement: Every page has its own document title
Each route SHALL set the document title to `<page> · DiveNet`, with `<page>` in the
active locale, and SHALL update it when the locale changes. Site, post and profile
pages SHALL use the site name, the post title and the diver's display name once
loaded, and SHALL use their generic translated page name before that.

#### Scenario: Static page title
- **WHEN** the app is opened at `/feed` with active locale `en`
- **THEN** the document title is "Feed · DiveNet"

#### Scenario: Title from data
- **WHEN** the site page of "SS Thistlegorm" has loaded
- **THEN** the document title is "SS Thistlegorm · DiveNet"

#### Scenario: Title follows the language
- **WHEN** the user switches to `uk` on `/dive-log`
- **THEN** the document title starts with the `uk` name of the dive log page

#### Scenario: Not-found title
- **WHEN** the app is opened at `/no-such-page`
- **THEN** the document title is the not-found page name followed by " · DiveNet"

#### Scenario: Every route has a title
- **WHEN** each route of the router is rendered
- **THEN** its document title ends with " · DiveNet" and differs from the bare "DiveNet"

### Requirement: Every list has an empty state
Every list on a page SHALL show a translated empty message when it has no items.
It MAY instead leave out its whole section, but only when the viewer cannot add an
item to it. A list SHALL NOT show its empty message while its data is still
loading.

#### Scenario: Empty list with an empty message
- **WHEN** a diver with no dives opens `/dive-log`
- **THEN** the page shows the dive log's empty message of the active locale

#### Scenario: Section left out for a viewer who cannot add
- **WHEN** a visitor opens the profile of a diver who has no published posts
- **THEN** the profile has no posts section

#### Scenario: No empty message while loading
- **WHEN** the feed is opened and the feed request has not answered yet
- **THEN** the feed's empty message is not shown
