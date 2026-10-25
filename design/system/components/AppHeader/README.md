# AppHeader

The sticky navy bar on every page: wordmark, main navigation, language switch and the account area.

- **Order:** wordmark "DiveNet" (link to `/`, the map) · navigation (Map, Feed, Dive log) · spacer · EN/UK switch · account area. Admins also see "Moderation".
- **Account area:** signed out shows a ghost-on-brand "Log in" link and a "Sign up" primary button; signed in shows the avatar (initials when no photo) opening a menu: Profile, My posts, Settings, Log out.
- **Current page:** `aria-current="page"` on the active link; it gets a 2px underline in `on-brand`.
- **Language switch:** two toggle buttons with `aria-pressed`; switching calls `i18n.changeLanguage`, which saves the choice and updates `<html lang>`. Labels are "EN" and "UK" in both locales.
- **Mobile (< `bp-md`):** navigation moves into a drawer opened by a menu button left of the wordmark; the drawer slides from the left over `scrim`, and holds the navigation, then the language switch, then account links.
- **Focus** on the navy bar uses `focus-inverse`.
- **Consumer provides:** the current user (or none), their role, and the active route.
