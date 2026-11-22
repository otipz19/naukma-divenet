import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Sets the document title to "<page> · DiveNet" in the active locale (spec shared/web-app), or to
 * the bare "DiveNet" while a page has no name yet. Re-runs when the page name or the language changes.
 */
export function useDocumentTitle(page?: string) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  useEffect(() => {
    document.title = page ? t("shell.title", { page }) : "DiveNet";
  }, [page, language, t]);
}
