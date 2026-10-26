import { useTranslation } from "react-i18next";
import styles from "./Page.module.css";

// Placeholder until add-dive-site-catalog replaces it with the map.
export function HomePage() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1 className="h1">{t("app.name")}</h1>
      <p className="body">{t("home.placeholder")}</p>
    </div>
  );
}
