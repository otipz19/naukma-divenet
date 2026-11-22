# Proposal

## Why

In the owner's review, the admin account behaved like a diver. It could log dives, write
posts and reviews, submit sites, and it had a profile (F-18). The admin also reached
moderation only through the account menu (F-19). The owner decided the admin is a
moderator only. On 2026-11-22 the owner narrowed the change to the web app: the project
only has to be demonstrated, so it is enough that the admin never *sees* a diver
feature. The server keeps its current rules.

## What Changes

- The web app treats a signed-in `ADMIN` as a moderator only:
  - **Hidden entry points.** The admin does not see:
    - the Dive log navigation entry;
    - "Log a dive here" and "Write a review" on a site page;
    - "Report a warning" (the Hide action on warnings stays);
    - "Add a site" on the map;
    - "Write a post" and the drafts aside on the feed;
    - Profile in the account menu and in the drawer.
  - **Guarded routes.** If the admin opens a diver page directly, the app sends them to
    `/admin/moderation`. Those pages are `/dive-log`, `/posts/new`, `/posts/:id/edit`,
    `/sites/new`, `/sites/:id/review`, the warning form routes, `/profile/edit` and
    `/profile/certificates`.
  - **No own profile.** The admin's own profile page `/users/<admin id>` shows the
    not-found page.
- **Moderation in the header (F-19).** The main navigation gets a Moderation entry after
  Map and Feed, shown only to an admin. It carries a badge with the number of pending
  items (sites and certificates), it is marked current on `/admin/moderation`, and it is
  in the phone drawer too. The Moderation item leaves the account menu and the drawer's
  account block. The admin's account menu now holds only the display name and Log out.
- Navigation entries can be limited by role. This replaces the fixed list in
  `app/navigation.ts`.
- **Docs.** F-18 records that the owner dropped server-side enforcement, and F-18 and
  F-19 are set to `taken: scope-admin-account`. The roadmap row says the change is
  front-end only. PRODUCT.md gains the role rule under "Domain decisions → Roles".

Out of scope, by the owner's decision on 2026-11-22:
- API enforcement: diver endpoints do not answer 403 for an admin.
- Any back-end, OpenAPI, migration or seed change.
- Hiding the admin's profile from other visitors. Nothing links to it, because the seed
  creates no admin content.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `auth`: a new web-app requirement says the admin is a moderator only in the UI. It
  covers the hidden diver entry points, the redirect from diver routes and the missing
  own profile.
- `shared/app-shell`: navigation entries can be limited to a role, and the admin's
  account menu holds only the display name and Log out.
- `site/moderation`: the moderation page is reached from a Moderation entry in the
  header navigation that shows the pending count, not from the account menu.
- `divelog/log-page`: the Dive log navigation entry is not shown to an admin.

User stories: US-08 (moderate sites), US-S1 (warnings: the admin hides but does not
report), US-C1 (certificates: the admin verifies but does not declare). The change adds
no new story.

## Plan updates absorbed

None. `docs/plan-updates/scope-admin-account/` holds no notes.

## Impact

- Front-end only:
  - `app/navigation.ts`, `components/AppHeader/NavLinks.tsx`;
  - `features/auth` (`AccountArea`, `RequireAuth`, a new role hook);
  - the entry points in `features/site`, `features/post`, `features/warning`,
    `features/user`;
  - i18n keys in `en` and `uk`;
  - Vitest tests.
- E2E: `admin-moderation.spec.ts` opens moderation from the header entry, not from the
  account menu.
- No API, OpenAPI, database, compose or design-token change. No departure from
  `docs/ARCHITECTURE.md`. The server still accepts diver calls from an admin, and the
  design records this as an accepted demo-only gap.
