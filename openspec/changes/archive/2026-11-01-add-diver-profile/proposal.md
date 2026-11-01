# Proposal

## Why

Divers have accounts but no identity: reviews and warnings show a bare name that leads nowhere.
This change delivers the part of US-11 that exists without later milestones: a public profile
with avatar and bio, and the privacy settings the next M3 changes must respect.

## What Changes

- Accounts gain a bio, an avatar and three privacy settings: dive log, statistics, certificates.
- Add public `GET /api/v1/users/{id}` and signed-in `PUT /api/v1/users/me`.
- Add the profile page at `/users/:id`, the edit page at `/profile/edit`, and a "Your profile" link
  in the account menu and drawer.
- Review and warning authors link to their profile, and review cards show the author's avatar.

Deferred, by the change that delivers it:

- `add-dive-log`: dive history, visited sites and statistics on the profile, and the notice for hidden ones.
- `add-certificates`: certificates on the profile.
- `add-achievements`: achievements on the profile.

This change stores the privacy settings but nothing reads them yet, because the content they guard does
not exist. It leaves plan-update notes telling `add-dive-log` and `add-certificates` to honour them.

Left out:

- **Changing the display name or email:** not in US-11.
- **The avatar in the header:** the session user has no avatar, and adding one touches the auth contract
  for a small gain. The header keeps its initials.

There is no departure from `docs/ARCHITECTURE.md`, so no new ADR.

## Plan updates absorbed

- `docs/plan-updates/add-diver-profile/add-site-reviews--review-author-link.md`
- `docs/plan-updates/add-diver-profile/add-site-warnings--warning-author-link.md`

## Capabilities

### New Capabilities

- `user/profile`: how a diver's public profile is read and edited, including its privacy settings.

### Modified Capabilities

- `review/site-reviews`: a review's author links to their profile and shows their avatar.
- `warning/site-warnings`: a warning's author links to their profile.

## Impact

- **Database:** migration `V11__add_user_profile.sql`.
- **Back-end:** `user.service` and `user.web`; the author of review responses gains `avatarUrl`.
- **API:** two new endpoints and one new response field, none breaking; regenerated `api/openapi.json` and `frontend/src/api/schema.gen.ts`.
- **Front-end:** new `features/user` and `components/Avatar`; `ReviewCard`, `WarningAlert`, `Alert`, `AccountArea`; `en` and `uk` strings.
- **Docs:** `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/HANDOFF.yaml`, plan-update notes.
- **Dependencies:** none added.
