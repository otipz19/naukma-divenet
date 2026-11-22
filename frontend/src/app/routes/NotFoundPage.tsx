import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useDocumentTitle } from "../documentTitle";
import styles from "./Page.module.css";

export function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t("notFound.title"));
  return (
    <div className={styles.page}>
      <h1 className="h1">{t("notFound.title")}</h1>
      <Link to="/">{t("notFound.backHome")}</Link>
    </div>
  );
}
