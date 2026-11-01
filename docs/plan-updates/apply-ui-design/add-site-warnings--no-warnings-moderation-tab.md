---
target: apply-ui-design
source: add-site-warnings
kind: constraint
stories: [US-S1]
created: 2026-11-01
---
## What changes for the target
Do not treat the missing "Warnings" tab of `design/screens/Moderation.html` as a gap to fix. The
Moderation page has the Sites queue only (and Certificates once `add-certificates` lands).

## Why
Warnings are published at once, so there is no queue for admins to work through; admins hide a
warning from the site page. A tab of reported warnings needs a reporting feature that no story
asks for. Building the tab without a back-end would show an empty or fake list.

## What the source already built
Admins hide warnings with `POST /api/v1/admin/warnings/{id}/hide` from the Hide button on each
warning of the site page (`frontend/src/features/warning/SiteWarnings.tsx`).
