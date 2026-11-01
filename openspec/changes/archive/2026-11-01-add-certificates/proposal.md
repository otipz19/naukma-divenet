# Proposal

## Why

Divers cannot show their experience level, and the moderation and profile pages still lack the certificates the mockups show. This
change delivers US-C1 and the certificates part of US-11, and finishes M3.

## What Changes

- Add certificates: an agency (PADI, SSI, CMAS or other), a level, a number and an optional photo.
- Add endpoints for divers to declare, edit and delete their certificates, and for anyone to read them within the diver's privacy setting.
- Add admin endpoints to verify a certificate, or reject it with a reason, and a Certificates tab on the moderation page.
- Add a certificates page at `/profile/certificates`, a Certificates section on the profile, and a verified badge on review authors.

Left out:

- **The "Issued 2021" line in `Profile.html`:** PRODUCT.md's certificate has no issue date.
- **Contacting agencies:** PRODUCT.md rules it out. Verification is an admin's judgement.
- **A ranking of levels:** a level is free text, so "highest" in the badge note cannot be computed. The badge shows the most recently verified certificate instead (design D4).

There is no departure from `docs/ARCHITECTURE.md`, so no new ADR.

## Plan updates absorbed

- `docs/plan-updates/add-certificates/add-diver-profile--privacy-settings.md`
- `docs/plan-updates/add-certificates/add-site-reviews--review-author-badge.md`

## Capabilities

### New Capabilities

- `user/certificates`: how divers declare certificates and who may read them.
- `user/certificate-verification`: how admins verify or reject them.

### Modified Capabilities

- `user/profile`: the profile page shows certificates, or a notice when hidden.
- `review/site-reviews`: a review's author shows a verified badge.
- `site/moderation`: the moderation page has a tab for each queue.

## Impact

- **Database:** migration `V13__create_certificates.sql`.
- **Back-end:** `certificate` classes in the `user` package; `ReviewService` asks for badges.
- **API:** new endpoints and one new response field, none breaking; regenerated `api/openapi.json` and `frontend/src/api/schema.gen.ts`.
- **Front-end:** new pages and sections in `features/user`; `ModerationPage`, `ReviewCard`, `ProfilePage`, `AccountArea`; `en` and `uk` strings.
- **Docs:** `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/HANDOFF.yaml`.
- **Dependencies:** none added.
