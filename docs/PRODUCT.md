# DiveNet — Product

DiveNet is a social platform for the scuba-diving community. Divers find dive
sites on a map, read and write reviews, keep a log of their dives and share
their experience in blog posts tied to sites and regions.

This is a university course project. It must be presentable as a complete, working
product rather than run as a real market product. It is developed entirely by coding agents
through OpenSpec changes (see [ROADMAP.md](ROADMAP.md)).

## Problem

Existing diving software usually covers only one need:

- Electronic logbooks (Subsurface, Garmin Dive) focus on personal telemetry and
  have little social interaction.
- Dive-site catalogs hold static data (depth, bottom type) without first-hand
  experience.
- Community discussion is scattered across messenger groups and forums.

DiveNet combines a site catalog, first-hand reviews, a personal dive log and a
community feed in one place.

## Personas

| Persona | Needs |
| --- | --- |
| Beginner diver | Find sites that match their certification level; read others' experience and warnings. |
| Experienced / technical diver | Log dives with parameters; share detailed reports; contribute new sites. |
| Instructor / dive center | Publish posts about sites and regions they operate in. Uses the same account type as other divers; there are no business accounts. |
| Administrator | Moderate user-submitted sites; verify declared certificates; handle reported content. |

## Scope

### In scope

- Interactive world map with clustered dive-site markers, search and filters.
- Dive-site pages: details, aggregated rating and difficulty, photos, reviews,
  warnings, linked posts.
- Reviews with ratings and photos; edit and delete own review.
- User-submitted sites, published only after admin approval.
- Accounts: register, log in, profile, privacy settings, declared certificates
  (verified by an admin).
- Dive log: mark a site as visited with a date and optional parameters (max
  depth, visibility, water temperature, current, buddies).
- Achievements awarded automatically by fixed rules.
- Blog posts (draft / published) linked to a region and/or a site; global feed,
  region feed and site feed.
- Site warnings (hazards and incidents) posted by users and shown on the site page.
- UI in English and Ukrainian (i18n).
- Seed data: realistic dive sites, demo users and posts, so the demo is never empty.
- Safety disclaimer: the information is for reference only and does not replace
  dive planning according to agency standards.

### Stretch (only after all core milestones)

- Gear Locker: a personal equipment inventory.
- Video attachments in reviews and posts.
- Object storage (MinIO) instead of local disk for media.

### Out of scope

- Route building and navigation.
- Offline mode and offline synchronisation.
- Real-time push (websockets) for warnings or notifications.
- Email confirmation, password reset by email, OAuth / social login.
- Integration with dive computers or certification agencies' APIs.
- Business or dive-center accounts, payments, bookings.
- Native mobile apps (the web UI must be usable on mobile widths).

## Domain decisions

- **Review vs. post.** A review belongs to exactly one site and carries a
  rating. A post is a free-form blog entry that may link to one site and/or one
  region. They are separate entities.
- **Regions.** A fixed, seeded hierarchy (country → region), not map polygons.
  Each site belongs to one region.
- **Difficulty.** A site has a declared difficulty from 1 to 5, set when the
  site is created. It also has a community difficulty: the average of the
  difficulty ratings in its reviews.
- **Gear.** A fixed seeded list of gear items. A site lists the gear it requires
  and the gear it recommends.
- **Certificates.** Users declare an agency (PADI, SSI, CMAS, other), a level,
  a number and an optional photo. An admin marks a certificate as verified. The
  platform never contacts an agency.
- **Roles.** `USER` and `ADMIN`. Anonymous visitors can read all public content.
- **Achievements.** About eight hard-coded rules (for example: first logged dive,
  10 sites visited, 5 published posts, first approved site). Each rule exposes
  its progress.

## Backlog

These are user stories. Each one is delivered by one or more OpenSpec changes
listed in [ROADMAP.md](ROADMAP.md), and the change proposal cites the story IDs.
Once a change is archived, its spec in `openspec/specs/` is the source of truth
for that behaviour. Stories are numbered as in the original course document.
US-14 does not exist.

### Map, sites, search

- **US-01 Browse the map.** As a diver, I want a world map with dive sites
  marked, so that I can discover places to dive.
  - The map supports pan and zoom, and the markers cluster.
  - Clicking a marker shows a short summary that links to the site page.
- **US-02 Site details.** As a diver, I want detailed site information so I can
  judge whether a site suits me.
  - The page shows: name, coordinates, region, description, declared and
    community difficulty, depth range, required and recommended gear, average
    rating, photos, reviews, warnings and linked posts.
- **US-03 Read reviews.** As a diver, I want to read other divers' reviews of a site.
  - Each review shows its author, date, text and rating (if one was given).
- **US-04 Rate and review.** As a diver, I want to rate a site and write a
  review, so that I help others.
  - Authenticated users can leave a rating and/or text, with photos attached.
  - The site rating is the aggregate of user ratings.
  - Authors can edit their own review and rating, and delete their own review.
- **US-05 Filter sites.** As a diver, I want to filter sites by several
  criteria at once.
  - Criteria: difficulty, required gear, region/country, depth range, minimum rating.
  - Filters combine with each other and with the name search.
  - The map shows only the matching sites.
- **US-06 Search sites.** As a diver, I want to search sites by name or location.
  - The search matches site name, region and country.
  - Results link to the site page, and an empty result shows a "nothing found" message.
- **US-07 Submit a site.** As a diver, I want to add a new dive site to the map.
  - Authenticated users submit a site. It stays hidden from others until an
    admin approves it, and its author can see its status.
- **US-08 Moderate sites.** As an admin, I want to review submitted sites to
  keep the information accurate.
  - An admin can approve a submission, or reject it with a reason.

### Safety

- **US-S1 Site warnings** (from the original project plan). As a diver, I want to see and
  post warnings about a site (hazards, incidents, changed conditions), so that
  others dive safely.
  - Warnings have a type, text, date and author.
  - Recent warnings are shown at the top of the site page.
  - Admins can hide a warning.

### Divers

- **US-09 Dive log.** As a diver, I want to mark sites I have dived, so that I
  keep a history of my dives.
  - A diver picks a site from the catalog or the map, then sets a date and
    optional parameters (max depth, visibility, water temperature, current,
    buddies, notes).
  - Entries can be edited and deleted.
- **US-10 Achievements.** As a diver, I want achievements for activity so I can
  track my progress.
  - Rules are evaluated on relevant actions and awarded immediately.
  - The profile shows earned and locked achievements, with progress towards each.
- **US-11 Diver profile.** As a diver, I want a public profile showing my dives
  and achievements.
  - The profile shows: display name, avatar, bio, certificates (with a verified
    badge), visited sites, dive history and achievements.
  - Any visitor can view a public profile.
  - The owner controls whether their dive log, statistics and certificates are
    shown publicly.
- **US-C1 Certificates** (from the original project plan). As a diver, I want to declare my
  certifications, so that others see my experience level.
  - Admins verify declared certificates.

### Posts and feeds

- **US-12 Blog.** As a diver, I want to write posts about my dives.
  - Users create, edit and delete posts with text and images.
  - A post can link to a region and/or a site.
  - Posts are either drafts or published; published posts appear in the
    author's blog.
- **US-13 Global feed.** As a diver, I want a feed of recent posts from everyone.
  - The feed is reverse-chronological and paginated.
- **US-15 Region feed.** As a diver, I want posts about a chosen area.
  - The feed can be filtered by country or region.
- **US-16 Site feed.** As a diver, I want posts about a specific site.
  - The site page shows the posts linked to that site.

## Glossary

| Term | Meaning |
| --- | --- |
| Dive site | A named underwater location with coordinates. In this product it is a "site". |
| Review | A rating and/or text about one site by one user. |
| Post | A free-form blog entry, optionally linked to a site and/or region. |
| Dive log entry | A record that a user dived a site on a date, with optional parameters. |
| Warning | A user report of a hazard or incident at a site. |
| CMAS / PADI / SSI | Diving certification organisations. |
| DEMA | Diving Equipment & Marketing Association. |
