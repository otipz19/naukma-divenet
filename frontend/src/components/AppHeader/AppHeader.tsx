import { Menu } from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { NavItem } from "../../app/navigation";
import { LanguageSwitch } from "../LanguageSwitch/LanguageSwitch";
import { NavDrawer } from "../NavDrawer/NavDrawer";
import { ThemeSwitch } from "../ThemeSwitch/ThemeSwitch";
import styles from "./AppHeader.module.css";
import { NavLinks } from "./NavLinks";

/** Renders the account area for the header bar or the drawer; the drawer passes its close action. */
export type RenderAccount = (placement: "header" | "drawer", onNavigate?: () => void) => ReactNode;

/**
 * The sticky navy bar: wordmark, main navigation, language and theme switches and account area.
 * Below 768px a menu button replaces them and opens the drawer that holds them all. The app layer supplies
 * the navigation entries and the account area, so this component knows nothing about features or
 * roles (add-authentication D10).
 */
export function AppHeader({ navItems, account }: { navItems: NavItem[]; account?: RenderAccount }) {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuButton.current?.focus();
  }, []);
  return (
    <header className={styles.header}>
      <button
        ref={menuButton}
        type="button"
        className={styles.menuButton}
        aria-label={t("shell.menu.open")}
        aria-expanded={drawerOpen}
        aria-controls={drawerOpen ? "nav-drawer" : undefined}
        onClick={() => setDrawerOpen(true)}
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <Link to="/" className={`h3 ${styles.logo}`}>
        {t("app.name")}
      </Link>
      <nav className={styles.nav} aria-label={t("shell.nav.label")}>
        <NavLinks items={navItems} />
      </nav>
      <span className={styles.spacer} />
      <LanguageSwitch className={styles.wide} />
      <ThemeSwitch className={styles.wide} />
      {account && <div className={styles.wide}>{account("header")}</div>}
      {drawerOpen && (
        <NavDrawer id="nav-drawer" items={navItems} onClose={closeDrawer} account={account} />
      )}
    </header>
  );
}
