# F-18 The admin account acts as a diver

- **Area:** Roles (whole app)
- **Status:** decided (owner, 2026-11-21: the admin is a moderator only, with no diver features)
- **Delivered by:** `scope-admin-account` (proposed roadmap item, see the index)

## Seen
Signed in as admin, the owner can log dives and write posts, and the admin has a
profile. An admin should not see these options at all.

## Cause
This was a decision by default. PRODUCT.md defines the roles `USER` and `ADMIN` and
gives the admin moderation duties, but it never says what an admin can *not* do. Every
feature checks only "signed in", so the bootstrapped admin
(`ADMIN_EMAIL`/`ADMIN_PASSWORD`) is a full diver plus the moderation page. The
back-end checks `ADMIN` only for the moderation endpoints (`SecurityConfig`) and for
reading private certificate details.

## Decision
The admin is a staff account, not a diver. It reads all public content like a
visitor, and moderates. It has none of the diver features:

| Feature | Admin |
| --- | --- |
| Public profile, profile edit, avatar, privacy | none; `/users/<admin id>` answers not found |
| Dive log, statistics, achievements | none |
| Posts and drafts ("Write a post") | none |
| Certificates, gear locker | none |
| Reviews, warnings, site submission | none (see the open point below) |
| Moderation queues, hiding warnings | yes |
| Map, site pages, feed, other profiles | read-only, like a visitor |

## What has to change
- **UI:** no diver entry points for an admin. That covers the header's "Log a dive"
  offer, "Write a review", "Report a warning", "Log a dive" and "Submit a site" on
  pages, "Write a post" and drafts in the feed, and the profile and dive-log items in
  the account menu. Routes such as `/dive-log`, `/posts/new` and
  `/profile/certificates` redirect an admin to `/admin/moderation`.
- **API:** the same rule on the server. Diver endpoints (dive log, posts, reviews,
  warnings, certificates, gear, profile edit, site submission) answer `403` for an
  admin, so hiding the buttons is not the only guard. Public reads stay open.
- **Specs:** a role rule in `auth` (or a new `shared/roles` spec) and one scenario per
  feature spec. **PRODUCT.md:** add the rule under "Domain decisions → Roles".
- **Seed and bootstrap:** the admin gets no profile content. A demo database that
  already holds admin-authored content is not expected; the seed creates none.

## Open point (owner)
Hiding warnings is moderation, but *posting* a warning could be an official safety
notice. Recommended: no. Admins stay out of content, for a clear split. Confirm when
the change is proposed.
