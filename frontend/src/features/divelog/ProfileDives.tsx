import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import { formatDiveNumber, useDiveLog, useDiveStats, useVisitedSites } from "./api";
import { DiveTable } from "./DiveTable";
import styles from "./DiveLog.module.css";

/** Visited sites and dive history on a profile; a section the viewer may not see is not requested. */
export function ProfileDives({
  userId,
  own,
  showDiveLog,
}: {
  userId: number;
  own: boolean;
  showDiveLog: boolean;
}) {
  const { t } = useTranslation();
  const canSeeLog = own || showDiveLog;
  const visited = useVisitedSites(userId, canSeeLog);
  const log = useDiveLog(userId, canSeeLog);
  const entries = log.data?.pages.flatMap((page) => page.content) ?? [];

  return (
    <>
      {!canSeeLog && (
        <span className={`body-sm ${styles.muted}`}>{t("divelog.profile.hidden")}</span>
      )}
      {canSeeLog && (log.isError || visited.isError) && (
        <Alert tone="danger" live>
          {t("divelog.loadError")}
        </Alert>
      )}
      {canSeeLog && log.isSuccess && entries.length === 0 && (
        <span className={`body ${styles.muted}`}>{t("divelog.profile.none")}</span>
      )}
      {visited.data && visited.data.length > 0 && (
        <section className={styles.section}>
          <h2 className={`h2 ${styles.flush}`}>{t("divelog.profile.visited")}</h2>
          <div className={styles.visited}>
            {visited.data.map((site) => (
              <Link key={site.siteId} className={styles.visitedCard} to={`/sites/${site.siteId}`}>
                <span className="h3">{site.name}</span>
                <span className={`body-sm ${styles.muted}`}>
                  {`${t(`geo.countries.${site.countryCode}`)} · ${t(`geo.regions.${site.regionCode}`)} · ${t("divelog.profile.diveCount", { n: site.dives })}`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {entries.length > 0 && (
        <section className={styles.section}>
          <h2 className={`h2 ${styles.flush}`}>{t("divelog.profile.history")}</h2>
          <DiveTable entries={entries} />
          {log.hasNextPage && (
            <div>
              <Button
                variant="secondary"
                disabled={log.isFetchingNextPage}
                onClick={() => void log.fetchNextPage()}
              >
                {t("divelog.loadMore")}
              </Button>
            </div>
          )}
        </section>
      )}
    </>
  );
}

/** The dive statistics in the profile header (Profile.html); hidden ones are not requested. */
export function ProfileStats({
  userId,
  own,
  showStatistics,
}: {
  userId: number;
  own: boolean;
  showStatistics: boolean;
}) {
  const { t, i18n } = useTranslation();
  const stats = useDiveStats(userId, own || showStatistics);
  return (
    <>
      {stats.data && (
        <dl className={styles.statsList}>
          <div>
            <dt className={`caption ${styles.muted}`}>{t("divelog.profile.dives")}</dt>
            <dd className="h2">{stats.data.dives}</dd>
          </div>
          <div>
            <dt className={`caption ${styles.muted}`}>{t("divelog.profile.sites")}</dt>
            <dd className="h2">{stats.data.sites}</dd>
          </div>
          <div>
            <dt className={`caption ${styles.muted}`}>{t("divelog.profile.deepest")}</dt>
            <dd className="h2">
              {stats.data.deepest == null
                ? "—"
                : `${formatDiveNumber(stats.data.deepest, i18n.language)} ${t("divelog.units.m")}`}
            </dd>
          </div>
        </dl>
      )}
    </>
  );
}
