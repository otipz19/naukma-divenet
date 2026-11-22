import type { ParseKeys } from "i18next";
import { useIsAdmin } from "../features/auth/useSession";
import { usePendingModerationCount } from "../features/site/usePendingModerationCount";

export interface NavItem {
  to: string;
  labelKey: ParseKeys;
  /** Match only this exact path, so `/` is not current on every page. */
  end?: boolean;
  /** Who sees the entry: only the admin, everyone but the admin, or (unset) everyone. */
  audience?: "admin" | "notAdmin";
  /** A count shown next to the label; no badge when it is 0 or unset. */
  badge?: number;
}

// The main navigation in the header and the drawer. Feature changes add their entries here.
export const navItems: NavItem[] = [
  { to: "/", labelKey: "shell.nav.map", end: true },
  { to: "/feed", labelKey: "shell.nav.feed" },
  { to: "/dive-log", labelKey: "shell.nav.diveLog", audience: "notAdmin" },
  { to: "/admin/moderation", labelKey: "shell.nav.moderation", audience: "admin" },
];

/** The entries for the current visitor, with the pending count on Moderation (spec site/moderation). */
export function useNavItems(): NavItem[] {
  const isAdmin = useIsAdmin();
  // Only the admin may read the queues; a diver never requests them.
  const pending = usePendingModerationCount(isAdmin);
  return navItems
    .filter((item) => !item.audience || (item.audience === "admin") === isAdmin)
    .map((item) => (item.to === "/admin/moderation" ? { ...item, badge: pending } : item));
}
