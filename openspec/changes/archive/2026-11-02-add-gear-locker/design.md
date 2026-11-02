# Design: add-gear-locker

## Context

The `user` feature already owns the profile and certificates, and `CertificateService` shows the pattern of owned rows. `site.domain.GearItem` is the fixed catalog that sites refer to; it includes things a diver does not own, such as nitrox, and has no brand or model. No screen in `design/` draws a locker, so the section reuses the profile's section and card styles, `TextField` and `Button`.

## Goals / Non-Goals

Goals: a diver can list what they own, and others can read it.

Non-goals: see the proposal's out of scope.

## Decisions

### D1. Free-text names, in the `user` feature

`V17__create_locker_items.sql`: `locker_items` with `id`, `user_id` (cascade with the user), `name varchar(100)`, `created_at`, and an index on `user_id`. The entity is `user.domain.LockerItem`, so it is not confused with the catalog's `GearItem`.

Free text lets a diver write "Suunto D5". Picking from the catalog would say less, and would need a second field for the model.

### D2. Public, with no privacy flag

A locker is what a diver chooses to show, like the bio. A fourth flag would add a column and an edit-page control for a list that holds no activity data. Adding one later is a small additive change.

### D3. Endpoints and limits

| Method and path | Access | Answer |
| --- | --- | --- |
| `GET /api/v1/users/{id}/gear-locker` | anyone | `LockerItemResponse[]` |
| `POST /api/v1/gear-locker` | signed in | 201 `LockerItemResponse` |
| `DELETE /api/v1/gear-locker/{id}` | owner | 204 |

The list is not paged: it is capped at 100 items, which also bounds what one account can store. The cap is checked by a count before the insert, so concurrent requests could pass it by a few, which is harmless.

Someone else's item answers 404 rather than 403, because the delete goes through `findByIdAndUser_Id`, and ids reveal nothing worth distinguishing. Removal needs no confirmation: re-adding a name is as cheap as the mistake.

### D4. Front-end

`features/user/ProfileGear.tsx` sits in `ProfilePage` after `ProfileCertificates`, waiting for the session like it. An inline form with one `TextField` and an Add button, using React Hook Form and Zod as other forms do. Items are a wrapping list of cards, and Remove is a ghost button named after its item. i18n: `user.gear.*` in `en` and `uk`.

## Risks / Trade-offs

- Item names are public, and only the owner controls them; they render as plain text.
- A typo means removing and adding again.

## Migration Plan

Additive migration; nothing existing changes.

## Open Questions

None.
