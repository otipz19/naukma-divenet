# site/details

## ADDED Requirements

### Requirement: The site page shows the posts about the site

The page of an approved site SHALL show up to 3 of the newest published posts linked to the site, each with its title, author and date, linking to the post. When there are more, it SHALL offer See all posts, linking to the feed filtered by the site. A site with no posts SHALL show no section, and an unapproved site SHALL make no request.

#### Scenario: Site with posts

- **WHEN** a visitor opens an approved site with linked posts
- **THEN** the page shows a Posts about this site section with links to the posts

#### Scenario: More than three posts

- **WHEN** a site has 4 linked posts
- **THEN** the section shows 3 and a See all posts link to `/feed?site=<id>`

#### Scenario: Three or fewer posts

- **WHEN** a site has 3 linked posts
- **THEN** the section offers no See all posts link

#### Scenario: Site without posts

- **WHEN** a visitor opens an approved site with no linked posts
- **THEN** the page shows no posts section

#### Scenario: Unapproved site

- **WHEN** the author opens their pending site
- **THEN** no posts are requested
