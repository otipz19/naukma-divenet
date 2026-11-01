---
target: add-dive-log
source: add-diver-profile
kind: constraint
stories: [US-11]
created: 2026-11-01
---
## What changes for the target
Honour the profile's privacy settings: hide the dive history and visited sites when `showDiveLog` is false,
and the statistics when `showStatistics` is false, from everyone but the owner. Enforce this at the API, not
only in the UI, and show the mockup's notice for a hidden section.

## Why
US-11 lets the owner control what is public. `add-diver-profile` stores the settings, but nothing they guard
exists until this change.

## What the source already built
`User` has `isShowDiveLog()` and `isShowStatistics()`; `GET /api/v1/users/{id}` returns them. The page is
`frontend/src/features/user/ProfilePage.tsx`, and the notice's wording is in `design/screens/Profile.html`.

## Roadmap edit when absorbed
Delivers: add "respects the profile's dive log and statistics privacy settings".
