---
target: add-certificates
source: add-diver-profile
kind: constraint
stories: [US-11]
created: 2026-11-01
---
## What changes for the target
Hide a diver's certificates from everyone but the owner and admins when `showCertificates` is false. Enforce
this at the API, not only in the UI. Decide there whether a review author's badge also follows the setting.

## Why
US-11 lets the owner control what is public. `add-diver-profile` stores the setting, but no certificates
exist until this change.

## What the source already built
`User` has `isShowCertificates()`; `GET /api/v1/users/{id}` returns it. The page is
`frontend/src/features/user/ProfilePage.tsx`.

## Roadmap edit when absorbed
Delivers: add "respects the profile's certificates privacy setting".
