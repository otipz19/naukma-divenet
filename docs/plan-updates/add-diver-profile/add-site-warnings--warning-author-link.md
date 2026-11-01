---
target: add-diver-profile
source: add-site-warnings
kind: add-scope
stories: [US-S1, US-11]
created: 2026-11-01
---
## What changes for the target
Link the author name in each warning's title on the site page to that author's public profile.

## Why
Warnings arrive before profiles, so `add-site-warnings` shows the author's display name as plain
text. Review authors get the same link through `add-site-reviews--review-author-link.md`; doing
both together keeps the site page consistent.

## What the source already built
`WarningResponse.author` has `id` and `displayName` (design D5 of add-site-warnings). The alert
is `frontend/src/features/warning/WarningAlert.tsx`.

## Roadmap edit when absorbed
Delivers: add "warning authors link to their profile".
