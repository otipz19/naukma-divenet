import { Menu } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { LanguageSwitch } from "../LanguageSwitch/LanguageSwitch";
import { NavDrawer } from "../NavDrawer/NavDrawer";
import styles from "./AppHeader.module.css";
import { NavLinks } from "./NavLinks";

/**
 * The sticky navy bar: wordmark, main navigation and language switch. Below 768px a menu
 * button replaces the navigation and the switch and opens the drawer that holds both.
 * add-authentication adds the account area after the switch.
 */
export function AppHeader() {
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
        <NavLinks />
      </nav>
      <span className={styles.spacer} />
      <LanguageSwitch className={styles.wide} />
      {drawerOpen && <NavDrawer id="nav-drawer" onClose={closeDrawer} />}
    </header>
  );
}
