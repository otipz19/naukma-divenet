---
target: add-diver-profile
source: add-site-reviews
kind: add-scope
stories: [US-03, US-11]
created: 2026-11-01
---
## What changes for the target
Link the author name on each review card of the site page to that author's public profile,
and show the profile's avatar in place of the initials.

## Why
Reviews arrive before profiles, so `add-site-reviews` shows the display name and initials only.
`design/screens/Site.html` shows the author name as a link with an avatar.

## What the source already built
`ReviewResponse.author` has `id` and `displayName` (design D4 of add-site-reviews). The card is
`frontend/src/features/review/ReviewCard.tsx`; add `avatarUrl` to the author object there.

## Roadmap edit when absorbed
Delivers: add "review authors link to their profile, with avatar".
