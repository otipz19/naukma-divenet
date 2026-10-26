import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { AppFooter } from "../components/AppFooter/AppFooter";
import { AppHeader, type RenderAccount } from "../components/AppHeader/AppHeader";
import { AccountArea } from "../features/auth/AccountArea";
import { restoreSession } from "../api/session";
import styles from "./AppLayout.module.css";

const renderAccount: RenderAccount = (placement, onNavigate) => (
  <AccountArea placement={placement} onNavigate={onNavigate} />
);

/** The frame around every route: skip link, header, the single main landmark and the footer. */
export function AppLayout() {
  const { t } = useTranslation();
  const main = useRef<HTMLElement>(null);
  // Once per page load: the access token lives only in memory, so a reload starts signed out.
  useEffect(() => {
    void restoreSession();
  }, []);
  return (
    <div className={styles.layout}>
      <a
        className="skip-link label"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        {t("shell.skipToContent")}
      </a>
      <AppHeader account={renderAccount} />
      <main id="main" ref={main} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
