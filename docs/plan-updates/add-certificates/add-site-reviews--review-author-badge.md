---
target: add-certificates
source: add-site-reviews
kind: add-scope
stories: [US-C1, US-03]
created: 2026-11-01
---
## What changes for the target
Show the author's highest verified certificate as a badge next to the review date, as
`design/screens/Site.html` does ("Verified AOWD").

## Why
Certificates do not exist when reviews are built, so `add-site-reviews` shows no badge.

## What the source already built
`ReviewResponse.author` (`id`, `displayName`) and `frontend/src/features/review/ReviewCard.tsx`
from add-site-reviews; add the badge field to the author object.

## Roadmap edit when absorbed
Delivers: add "verified badge on review authors".
