import type { ParseKeys } from "i18next";

export interface NavItem {
  to: string;
  labelKey: ParseKeys;
  /** Match only this exact path, so `/` is not current on every page. */
  end?: boolean;
}

// The main navigation in the header and the drawer. Feature changes add their entries here.
export const navItems: NavItem[] = [{ to: "/", labelKey: "shell.nav.map", end: true }];
