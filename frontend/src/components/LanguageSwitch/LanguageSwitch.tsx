import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n/language";
import styles from "./LanguageSwitch.module.css";

/**
 * EN/UK toggle buttons. `changeLanguage` saves the choice and updates `<html lang>` (src/i18n).
 * The labels are the language codes, the same in every locale.
 */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { t, i18n } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t("shell.language.label")}
      className={`${styles.switch} ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          className={`caption ${styles.option}`}
          aria-pressed={i18n.resolvedLanguage === code}
          onClick={() => void i18n.changeLanguage(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
