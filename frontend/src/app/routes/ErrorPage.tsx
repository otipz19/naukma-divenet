import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useRouteError } from "react-router";
import { Button } from "../../components/Button/Button";
import { useDocumentTitle } from "../documentTitle";
import styles from "./Page.module.css";

/**
 * Shown in the shell's main landmark when a page throws while rendering (spec shared/web-app).
 * It logs the error for developers but never shows its text to the visitor.
 */
export function ErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  useDocumentTitle(t("shell.error.heading"));
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={styles.page}>
      <h1 className="h1">{t("shell.error.heading")}</h1>
      <p className="body">{t("shell.error.text")}</p>
      <div className={styles.actions}>
        <Button variant="primary" onClick={() => window.location.reload()}>
          {t("shell.error.reload")}
        </Button>
        <Link to="/">{t("shell.error.home")}</Link>
      </div>
    </div>
  );
}
