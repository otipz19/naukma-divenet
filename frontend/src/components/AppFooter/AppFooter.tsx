import { useTranslation } from "react-i18next";
import styles from "./AppFooter.module.css";

/** The navy band with the safety disclaimer required on every page; it is never dismissible. */
export function AppFooter() {
  const { t } = useTranslation();
  return (
    <footer className={`body-sm ${styles.footer}`}>
      <div className={styles.inner}>
        <p className={styles.disclaimer}>
          <strong>{t("shell.footer.safetyLead")}</strong> {t("shell.footer.disclaimer")}
        </p>
        <p className={`caption ${styles.meta}`}>
          {`${t("shell.footer.project")} · ${t("shell.footer.mapData")}`}
        </p>
      </div>
    </footer>
  );
}
