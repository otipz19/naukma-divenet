# Proposal: add-gear-locker

## Why

Divers want to keep a list of the equipment they own, and show it on their profile. `docs/PRODUCT.md` lists the Gear Locker as a personal equipment inventory, and the roadmap has it as a stretch item. No user story exists for it, so this change stays at the core job.

## What Changes

- New table `locker_items`, holding a user's items by name.
- `GET /api/v1/users/{id}/gear-locker`, `POST /api/v1/gear-locker` and `DELETE /api/v1/gear-locker/{id}`.
- A Gear locker section on the profile page. The owner adds and removes items there; everyone else reads them.

## Capabilities

### New Capabilities

- `user/gear-locker`: the inventory API.

### Modified Capabilities

- `user/profile`: the profile page shows the gear locker.

## Impact

- Stories: none; `docs/PRODUCT.md` "Gear Locker". The story is not added, because the roadmap row already names the work.
- Back-end: entity, service and controller in the `user` feature, migration `V17__create_locker_items.sql`, regenerated `api/openapi.json`.
- Front-end: `ProfileGear` in `features/user`, `en` and `uk` strings.
- `docs/ARCHITECTURE.md`: existing tables. No departure from its rules, so no ADR.

## Out of scope

- Editing an item: remove it and add it again.
- Categories, brands, photos, service dates, and links to the seeded gear catalog or to a site's required gear.
- A privacy setting: the locker is public, like the bio (design D2).
- Demo data: `complete-demo-seed`.

## Plan updates absorbed

None.

## Plan updates written

None.
