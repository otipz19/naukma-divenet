import { useTranslation } from "react-i18next";
import { Alert } from "../../components/Alert/Alert";

/** Announces achievements a save has just earned (spec divelog/log-page). */
export function UnlockedBanner({ codes }: { codes: string[] }) {
  const { t } = useTranslation();
  return (
    <>
      {codes.map((code) => (
        <Alert
          key={code}
          tone="success"
          live
          title={t("achievement.unlocked", { name: t(`achievement.items.${code}.name`) })}
        >
          {t(`achievement.items.${code}.description`)}
        </Alert>
      ))}
    </>
  );
}
