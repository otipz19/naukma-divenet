# Proposal: add-achievements

## Why

Divers log dives, publish posts and submit sites, but nothing marks their progress. US-10 asks for achievements that are awarded immediately on relevant actions, and US-11 asks for them on the profile with progress towards each. This is the only item of M5, and the last feature before release work.

## What Changes

- New `achievement` feature: tables `achievements` (eight definitions, seeded by migration) and `user_achievements`.
- Three application events: `DiveLogged`, `PostPublished` and `SiteApproved`. A listener re-evaluates the user's rules after the action commits, and an award is permanent.
- `GET /api/v1/users/{id}/achievements`: each achievement with its target, the user's progress and the earned date.
- An Achievements section on the profile, following `design/screens/Profile.html`, with earned and locked cards and progress bars.
- The achievement-unlocked banner of `design/screens/DiveLog.html` on the dive log page, after a save that earns one.

The eight rules:

| Code | Rule | Measures |
| --- | --- | --- |
| `first-dive` | Log your first dive | dives, 1 |
| `ten-dives` | Log 10 dives | dives, 10 |
| `ten-sites` | Dive at 10 different sites | sites, 10 |
| `globetrotter` | Dive in 5 countries | countries, 5 |
| `deep-diver` | Log a dive to 40 m or deeper | deepest dive, 40 |
| `first-post` | Publish your first post | published posts, 1 |
| `five-posts` | Have 5 published posts | published posts, 5 |
| `first-site` | Get a submitted site approved | approved sites, 1 |

## Capabilities

### New Capabilities

- `achievement/achievements`: the rules, awards, and the API.

### Modified Capabilities

- `user/profile`: the profile page shows achievements.
- `divelog/log-page`: the dive log page shows the unlocked banner.

## Impact

- Stories: US-10, and the achievements part of US-11.
- Back-end: new package `ua.ukma.divenet.achievement`, migration `V16__create_achievements.sql`, events and read methods in `DiveLogService`, `PostService` and `SiteModerationService`, regenerated `api/openapi.json`.
- Front-end: new `features/achievement`, a section in `ProfilePage`, the banner in `DiveLogPage` and `DiveForm`, `en` and `uk` strings.
- `docs/ARCHITECTURE.md`: existing tables, and the privacy rule for progress. No departure from its rules, so no ADR.

## Out of scope

- A banner after publishing a post or on site approval. The note asks for it only on the dive log, and the profile shows these.
- Notifications, and any review-based rule such as the design's "Reviewer": it would need a fourth event, and "about eight" rules are met without it.
- The design's wreck rule: sites have no wreck attribute.
- Backfilling awards for activity from before this change: a user earns them on their next relevant action (design D3).

## Plan updates absorbed

- `docs/plan-updates/add-achievements/add-dive-log--dive-logged-event.md`, with one addition: `DiveLogged` is also published on an edit, because an edit can change the deepest dive or the sites.
- `docs/plan-updates/add-achievements/add-posts--post-published-event.md`, with one change: `PostPublished` is published on every move to published, not only the first, because the rule counts current published posts (design D2).

## Plan updates written

- `docs/plan-updates/complete-demo-seed/add-achievements--award-seeded-users.md`
