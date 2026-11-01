# post/feed

## Purpose

The feed of recent published posts from everyone, through the API and the Feed page, filtered by country, region or site (US-13, US-15, US-16).

## ADDED Requirements

### Requirement: The API lists published posts from everyone

`GET /api/v1/posts` SHALL answer anyone with a page of published posts from all authors, newest publication first. Drafts SHALL never appear. Moving a post to drafts and publishing it again SHALL keep its place. The query count SHALL NOT grow with the page size.

#### Scenario: Newest first

- **WHEN** anyone lists posts, and two authors have published posts and a draft
- **THEN** the page holds the published posts of both, newest publication first, and no draft

#### Scenario: Published again

- **WHEN** a post is moved to drafts and published again after a newer post was published
- **THEN** it stays below the newer post

#### Scenario: Pages

- **WHEN** anyone asks for the second page
- **THEN** the page holds the next posts in the paged envelope

#### Scenario: Query count

- **WHEN** a page of ten posts with covers, regions and sites is listed
- **THEN** it uses the same number of queries as a page of one

### Requirement: The feed is filtered by country, region or site

`GET /api/v1/posts` SHALL accept `countryCode`, `regionCode` and `siteId`, and all given filters SHALL apply together. A filter that matches nothing SHALL give an empty page. A post with no region SHALL appear only unfiltered.

#### Scenario: By country

- **WHEN** posts are listed with a `countryCode`
- **THEN** the page holds only posts in that country's regions, those linked to a site included

#### Scenario: By region

- **WHEN** posts are listed with a `regionCode`
- **THEN** the page holds only posts in that region, those linked to a site in it included

#### Scenario: By site

- **WHEN** posts are listed with a `siteId`
- **THEN** the page holds only posts linked to that site

#### Scenario: Country and region disagree

- **WHEN** posts are listed with a region outside the given country
- **THEN** the page is empty

#### Scenario: Unknown filter value

- **WHEN** posts are listed with a code that does not exist
- **THEN** the API answers 200 with an empty page

### Requirement: The Feed page shows the posts

The app SHALL show the feed at `/feed` to anyone, in both languages, with post cards showing the cover, region, site, title, excerpt, author link, date and reading time, and Previous and Next controls when there is more than one page. The main navigation SHALL link to it.

#### Scenario: Reading the feed

- **WHEN** a visitor opens `/feed`
- **THEN** the page shows post cards, each with a link to its post and to its author

#### Scenario: Navigation entry

- **WHEN** the app is opened
- **THEN** the main navigation has a Feed link to `/feed`

#### Scenario: Paging

- **WHEN** there is more than one page and the visitor chooses Next
- **THEN** the page shows the next posts, and the URL holds the page

#### Scenario: Empty

- **WHEN** no post matches
- **THEN** the page shows an empty message

#### Scenario: Load failure

- **WHEN** the feed fails to load
- **THEN** the page shows an alert

### Requirement: The Feed page filters by country and region

The Feed page SHALL offer a country select and a region select limited to the chosen country. The filters SHALL be kept in the URL, and changing one SHALL return to the first page. Changing the country SHALL clear the region.

#### Scenario: Choosing a country

- **WHEN** the visitor chooses a country
- **THEN** the posts are requested with that country, and the region select offers only its regions

#### Scenario: Choosing a region

- **WHEN** the visitor chooses a region
- **THEN** the posts are requested with that region, and the URL holds it

#### Scenario: Changing the country

- **WHEN** a region is chosen and the visitor chooses another country
- **THEN** the region is cleared and the first page is shown

#### Scenario: Opening a filtered address

- **WHEN** a visitor opens `/feed?country=EG&region=eg-dahab`
- **THEN** the selects show that country and region, and the posts are filtered by them

#### Scenario: Region names in the active language

- **WHEN** a visitor reads the feed in `uk`
- **THEN** the selects and cards show Ukrainian country and region names

### Requirement: The Feed page can show one site's posts

Opening `/feed?site=<id>` SHALL filter the posts by that site, show which site is being filtered, and offer a link back to the whole feed.

#### Scenario: Filtered by a site

- **WHEN** a visitor opens the feed filtered by a site that has posts
- **THEN** only that site's posts are requested, and the page names the site with a link to the whole feed

### Requirement: Signed-in users write from the feed and see their drafts

The Feed page SHALL show a signed-in user a Write a post link and their drafts, each linking to its editor. A signed-out visitor SHALL see neither and SHALL NOT trigger a drafts request.

#### Scenario: Signed in

- **WHEN** a signed-in user with a draft opens the feed
- **THEN** the page shows a Write a post link and the draft

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens the feed
- **THEN** the page shows no Write a post link and no drafts, and no drafts are requested
