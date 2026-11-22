import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { THEME_CHOICES, setThemeChoice, useThemeChoice, type ThemeChoice } from "../../app/theme";
// The same pill as the language switch beside it (design/system/components/AppHeader).
import styles from "../LanguageSwitch/LanguageSwitch.module.css";

const ICONS: Record<ThemeChoice, LucideIcon> = { system: Monitor, light: Sun, dark: Moon };

/** System / Light / Dark toggle buttons (spec shared/app-shell). The choice is kept per browser. */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const current = useThemeChoice();
  return (
    <div
      role="group"
      aria-label={t("shell.theme.label")}
      className={`${styles.switch} ${className}`}
    >
      {THEME_CHOICES.map((choice) => {
        const Icon = ICONS[choice];
        return (
          <button
            key={choice}
            type="button"
            className={`caption ${styles.option} ${styles.icon}`}
            aria-label={t(`shell.theme.${choice}`)}
            aria-pressed={current === choice}
            onClick={() => setThemeChoice(choice)}
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
