import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { AppHeader, type RenderAccount } from "../components/AppHeader/AppHeader";
import { ToastProvider, ToastRegion } from "../components/Toast/Toast";
import { AccountArea } from "../features/auth/AccountArea";
import { DisclaimerDialog } from "../features/disclaimer/DisclaimerDialog";
import { restoreSession } from "../api/session";
import styles from "./AppLayout.module.css";
import { useNavItems } from "./navigation";

const renderAccount: RenderAccount = (placement, onNavigate) => (
  <AccountArea placement={placement} onNavigate={onNavigate} />
);

/** The frame around every route: skip link, header, the single main landmark, the first-visit disclaimer and the toast region. */
export function AppLayout() {
  const { t } = useTranslation();
  const main = useRef<HTMLElement>(null);
  const navItems = useNavItems();
  // Once per page load: the access token lives only in memory, so a reload starts signed out.
  useEffect(() => {
    void restoreSession();
  }, []);
  return (
    <ToastProvider>
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
        <AppHeader navItems={navItems} account={renderAccount} />
        <main id="main" ref={main} tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
        <DisclaimerDialog />
        <ToastRegion />
      </div>
    </ToastProvider>
  );
}
