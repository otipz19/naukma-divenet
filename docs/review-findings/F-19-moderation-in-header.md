# F-19 Moderation link is in the account menu, not the header navigation

- **Area:** App shell (admin)
- **Status:** decided (owner, 2026-11-21: move it to the header navigation)
- **Delivered by:** `scope-admin-account`

## Seen
An admin reaches the moderation page only through the account (profile) menu.

## Cause
`frontend/src/features/auth/AccountArea.tsx` adds a "Moderation" item to the account
menu and to the phone drawer's account block when `user.role === "ADMIN"`. The main
navigation (`shared/app-shell`: "lists the entries registered by features") has no
role-aware entries.

## Fix
- The main navigation gets a **Moderation** entry, shown only to an admin, after Map
  and Feed. It shows the total pending count (sites + certificates) as a badge, and
  is marked current on `/admin/moderation`.
- The item is removed from the account menu. With F-18, the admin's account menu
  holds only the name and Log out.
- On a phone, the entry is in the drawer's navigation list.
- Spec change in `shared/app-shell`: navigation entries can be limited to a role.
  `site/moderation` names the new entry point.
