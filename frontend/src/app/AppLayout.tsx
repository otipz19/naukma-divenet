import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { AppFooter } from "../components/AppFooter/AppFooter";
import { AppHeader } from "../components/AppHeader/AppHeader";
import styles from "./AppLayout.module.css";

/** The frame around every route: skip link, header, the single main landmark and the footer. */
export function AppLayout() {
  const { t } = useTranslation();
  const main = useRef<HTMLElement>(null);
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
      <AppHeader />
      <main id="main" ref={main} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
