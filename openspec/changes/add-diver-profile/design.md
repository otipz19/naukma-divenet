# Design

## Context

See proposal.md for motivation. `User` holds only account fields, and the `user` package has no service or
web layer. `MediaService.attach` and `release` exist, clear the persistence context, and report a refused
id (`add-site-reviews` notes). `PhotoField` already takes `max`. `GET /api/v1/**` is public by default.

## Goals / Non-Goals

**Goals:**

- A profile any visitor can open from a review or a warning.
- Stored privacy settings with a defined shape for the next changes to read.

**Non-Goals:**

- Enforcing the settings: nothing they guard exists yet.
- Showing avatars outside the profile and review cards.

## Decisions

### D1: Schema on `users`

`V10__add_user_profile.sql` adds to `users`:

```sql
bio varchar(500)
avatar_id uuid REFERENCES media (id) ON DELETE SET NULL
show_dive_log, show_statistics, show_certificates boolean NOT NULL DEFAULT true
```

A separate `profiles` table was rejected: one row per user, always read together. The default is public
because US-11 calls the profile public and the owner opts out. `avatar_id` is a plain UUID field on `User`,
like the way reviews refer to media through ids, so `user.domain` stays free of `media.domain`.

### D2: API

| Endpoint | Auth | Body and answer |
| --- | --- | --- |
| `GET /api/v1/users/{id}` | public | `ProfileResponse` |
| `PUT /api/v1/users/me` | signed in | `{ bio?, avatarId?, showDiveLog, showStatistics, showCertificates }` → `ProfileResponse` |

There is no `GET /users/me`: the edit page reads `GET /users/{id}` with the session's id, and the public
response holds every editable field. So no security rule is added: `PUT` already needs a token. The privacy
flags are public because the page will need them to explain hidden sections, and they reveal nothing else.

`PUT` replaces the whole profile, like the review and warning edits. The display name stays out, as does a
null-means-keep rule for the avatar: the form always sends the current one.

### D3: Avatar replacement

`ProfileService.update` follows `ReviewService.update`: attach a new id, release the old one, and reload the
user afterwards because both clear the persistence context. Attach runs first, so a refused upload leaves the
profile unchanged, and the refusal maps to a 400 field error for `avatarId` through a `FieldViolation`
problem, as `InvalidSiteException` does. The transaction undoes the attach if a later step fails, and release
deletes the file only after commit.

### D4: Author avatars in reviews

`avatarUrl` comes from `User.getAvatarId()` through a new static `MediaView.thumbnailUrlOf(UUID)`, which the
instance method also uses. The URL is derived from the id, so a page of reviews needs no extra query, and
`ReviewView`'s author gains the field. The note asked for this on `ReviewResponse.author`. Warnings get only
the link, as their note says, because the mockup's warning title has no avatar.

### D5: Front-end

- `components/Avatar`: `dn-avatar` with `initials`, optional `src` and a `size` of `md` or `lg`. The image has
  empty `alt`, since the name is always beside it. It takes initials as a prop, so the shared component does not
  import `features/auth`. `ReviewCard` and the profile page use it.
- `features/user/ProfilePage` at `/users/:id` follows the header of `Profile.html`, without the sections later
  changes add. It uses `white-space: pre-line` for the bio.
- `features/user/ProfileEditPage` at `/profile/edit`, inside `RequireAuth`: React Hook Form with a Zod schema,
  `TextAreaField`, `PhotoField` with `max={1}` and native checkboxes in a fieldset. The design system has no
  checkbox component, and the native control is accessible; it gets a small CSS module using tokens.
- A hint under the privacy settings says they apply as those sections arrive, so a demo does not suggest a
  control is broken.
- `Alert`'s `title` widens from `string` to `ReactNode`, so `WarningAlert` can put a link in it.
- After a save, the `["users", id]` and `["sites"]` queries are invalidated, so reviews show a new avatar.

### i18n

No new namespace. New key groups: `user.profile.*`, `user.edit.*`; new key `shell.account.profile`.

## Risks / Trade-offs

- [A saved privacy setting has no visible effect yet] → The hint says so, and notes bind the later changes.
- [The header shows initials while the profile shows an avatar] → Accepted; see proposal.md.
- [Public flags tell visitors what a diver hides] → The mockup's notice says the same thing.
- [Two tabs editing one profile] → The last write wins. If one tab released an avatar, the other tab's save is
  refused with a field error, and its entered values stay in the form.

## Migration Plan

Forward-only migration with defaults, so existing accounts become public profiles with no bio or avatar.
