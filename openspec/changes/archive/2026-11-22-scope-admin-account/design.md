# Design

## Context

The proposal (Why) explains the motivation. The owner narrowed the scope to the web app.
These parts of the current front-end matter here:

- **Roles.** `SessionUser.role` (`USER` or `ADMIN`) comes from `useSession()`. Three
  components check it today: `RequireAuth` (with `admin` it shows non-admins the
  not-found page), `AccountArea` (the Moderation item) and `SiteWarnings` (the Hide
  action).
- **Navigation.** The main navigation is the static list `navItems` in
  `app/navigation.ts`. `components/AppHeader/NavLinks.tsx` renders it, in the header and
  in `NavDrawer`. `AppHeader` receives the account area as a render prop from
  `AppLayout`, so components stay free of feature code (add-authentication D10).
- **Queue counts.** The moderation page already loads both queues.
  `useSiteQueue()` in `ModerationPage.tsx` uses the key `["sites", "admin-queue"]`, and
  `useCertificateQueue()` in `CertificateQueue.tsx` uses `["certificates",
  "admin-queue"]`. Approve and reject invalidate `["sites"]` and `["certificates"]`.
  Both queue endpoints answer 403 to a `USER`.
- **Diver pages.** Each feature's `routes.tsx` wraps its diver pages in `RequireAuth`.

## Goals / Non-Goals

**Goals:**
- One role check that every feature uses, so the rule lives in one place.
- The navigation decides which entries a visitor sees, while `components/` keeps no
  knowledge of features or roles.
- The pending count needs no new endpoint and stays in step with the moderation page.

**Non-Goals:**
- Server-side enforcement, API, OpenAPI, migration or seed changes (proposal, out of
  scope).
- Hiding the admin's profile from other visitors.

## Decisions

### D1. `useIsAdmin()` next to `useSession()`
`features/auth/useSession.ts` exports `useIsAdmin(): boolean`. It returns true only for a
signed-in `ADMIN`, and false while loading or signed out. `SiteWarnings` and
`ProfilePage` switch to it.
*Alternative:* a role check inline in each component, as the code does today. Rejected:
this change adds about ten checks, and a single named hook makes them easy to find with
grep and to test.

### D2. `RequireAuth diver` redirects the admin
`RequireAuth` gains a `diver` flag. For an admin it renders
`<Navigate to="/admin/moderation" replace />`, so the diver page never mounts and makes no
requests. The signed-out and loading paths stay as they are. Every diver route in
`divelog`, `post`, `site`, `review`, `warning` and `user` uses `<RequireAuth diver>`.
*Alternative:* the not-found page, as `admin` does for non-admins. Rejected: the owner's
F-18 asks for a redirect, and sending the admin to their own work is more helpful than a
dead end.

### D3. Own profile shows not-found
`ProfilePage` renders `NotFoundPage` when `useIsAdmin()` is true and the route id equals
the session user's id. It does this before the profile query runs (`enabled: false`).
Other profiles render as they do now. The account menu and drawer render "Profile" only
when `!isAdmin`.

### D4. Navigation entries carry an audience, and the app layer filters them
`NavItem` gains `audience?: "admin" | "notAdmin"` (none means everyone) and
`badge?: number`.
- `navItems` adds `{ to: "/admin/moderation", labelKey: "shell.nav.moderation",
  audience: "admin" }` after Feed and marks Dive log `audience: "notAdmin"`.
- A new hook, `useNavItems()` in `app/navigation.ts`, filters the list by `useIsAdmin()`
  and fills in the Moderation badge.
- `AppLayout` passes the result to `AppHeader` as `navItems`. `AppHeader` hands it on to
  `NavLinks` and to `NavDrawer`, which now take `items` as a prop instead of importing
  the list.

*Alternative:* `NavLinks` calls `useSession`. Rejected: `components/` would then depend on
`features/auth`, which breaks D10.

### D5. Pending count from the existing queue queries
`features/site` exports `usePendingModerationCount(enabled)`. It calls `useSiteQueue` and
`useCertificateQueue`, which now take an `enabled` option, and returns the sum of the two
`page.totalElements` values. It returns `undefined` while either query is loading.
`useNavItems` passes `enabled = isAdmin`, so a diver never calls the admin endpoints and
never gets a 403.

The badge and the moderation page share the same query keys. As a result, an
approval's existing invalidation updates the badge with no extra code (spec "Count
follows moderation").

`NavLinks` shows the shared `Badge` component when `badge > 0`. The link's accessible
name becomes "Moderation, 3 pending" (`shell.nav.pending`, with plural forms for `uk`).
*Alternative:* a new count endpoint. Rejected: the scope is front-end only, and two small
cached queries are enough.

### D6. Hidden entry points use `useIsAdmin()` at the call site
These components render their diver actions only when `!isAdmin`:
- `SitePage` hides "Log a dive here" and `ReviewLink`.
- `SiteWarnings` hides "Report a warning" and keeps Hide.
- `MapPage` hides `addSite`.
- `FeedPage` hides "Write a post" and the drafts aside. `useDrafts(signedIn && !isAdmin)`
  also stops the drafts request.

Each component's existing test file gains an admin case. Admin-owned edit links
(`ReviewCard`, `WarningAlert`, `PostPage`) show only on the user's own content, and an
admin has none, so they need no change.

### D7. i18n
The `shell` namespace changes in both `en` and `uk`:
- adds `shell.nav.moderation` ("Moderation" / "Модерація");
- adds `shell.nav.pending` with plural forms (`_one`/`_other` in `en`;
  `_one`/`_few`/`_many`/`_other` in `uk`);
- removes `shell.account.moderation`, which is no longer used.

This change adds no REST endpoints and no Flyway migrations.

## Risks / Trade-offs

- [The API still accepts diver calls from an admin, through a hand-made request.] → The
  owner accepted this for the demo (proposal, out of scope). F-18 records it, so a later
  change can add the 403s.
- [A `Badge` on the navy header bar may fail contrast in the axe audit.] → Use the
  Badge's existing tone that the design system pairs with dark surfaces. The E2E a11y job
  checks the moderation page, signed in as the admin.
- [The badge loads two queue pages on every page for the admin.] → The queries are
  cached by TanStack Query and only the admin runs them. The cost is negligible for a
  demo.
- [E2E `admin-moderation.spec.ts` opens moderation through the account menu.] → It
  switches to the header entry in this change.
