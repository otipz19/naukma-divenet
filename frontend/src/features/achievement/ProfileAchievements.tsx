import { useTranslation } from "react-i18next";
import { Alert } from "../../components/Alert/Alert";
import { formatReviewDate } from "../review/ReviewCard";
import { useAchievements, type Achievement } from "./api";
import styles from "./Achievement.module.css";

/** Earned and locked achievements on a profile (spec user/profile). */
export function ProfileAchievements({ userId }: { userId: number }) {
  const { t } = useTranslation();
  const achievements = useAchievements(userId);
  const items = achievements.data ?? [];

  if (achievements.isError) {
    return (
      <Alert tone="danger" live>
        {t("achievement.loadError")}
      </Alert>
    );
  }
  if (items.length === 0) return null;
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={`h2 ${styles.flush}`}>{t("achievement.title")}</h2>
        <span className={`body-sm ${styles.muted}`}>
          {t("achievement.earnedCount", {
            earned: items.filter((item) => item.earnedAt).length,
            total: items.length,
          })}
        </span>
      </div>
      <div className={styles.grid}>
        {items.map((item) => (
          <AchievementCard key={item.code} achievement={item} />
        ))}
      </div>
    </section>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const { t, i18n } = useTranslation();
  const { code, target, progress, earnedAt } = achievement;
  const name = t(`achievement.items.${code}.name`);
  const description = t(`achievement.items.${code}.description`);
  return (
    <div className={earnedAt ? styles.card : styles.locked}>
      <span className={earnedAt ? styles.icon : styles.lockIcon}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          {earnedAt ? (
            <>
              <path d="M12 22V8" />
              <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
              <circle cx="12" cy="5" r="3" />
            </>
          ) : (
            <>
              <rect width="18" height="11" x="3" y="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </>
          )}
        </svg>
      </span>
      <span className="label">{name}</span>
      <span className={`body-sm ${styles.muted}`}>{description}</span>
      {earnedAt ? (
        <span className={`body-sm ${styles.muted}`}>
          {t("achievement.earnedOn", { date: formatReviewDate(earnedAt, i18n.language) })}
        </span>
      ) : (
        progress != null && (
          <>
            <div
              className={styles.track}
              role="progressbar"
              aria-label={t("achievement.progressLabel", { name })}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={target}
            >
              <div className={styles.bar} style={{ width: `${(progress / target) * 100}%` }} />
            </div>
            <span className={`caption ${styles.muted}`}>
              {t("achievement.progress", { progress, target })}
            </span>
          </>
        )
      )}
    </div>
  );
}
