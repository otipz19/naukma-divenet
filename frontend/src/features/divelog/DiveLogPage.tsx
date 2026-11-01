import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import { useSession } from "../auth/useSession";
import { formatDiveNumber, useDiveLog, useDiveStats, type DiveEntry } from "./api";
import { DiveForm } from "./DiveForm";
import { DiveTable } from "./DiveTable";
import styles from "./DiveLog.module.css";

/** The dive log at `/dive-log`, inside `RequireAuth` (spec divelog/log-page). */
export function DiveLogPage() {
  const { t, i18n } = useTranslation();
  const session = useSession();
  const userId = session.status === "signedIn" ? session.user.id : 0;
  const [params] = useSearchParams();
  const siteParam = params.get("site");
  const startSiteId = siteParam && /^\d+$/.test(siteParam) ? Number(siteParam) : null;

  const startSite = useQuery({
    queryKey: ["sites", String(startSiteId), userId],
    queryFn: async () =>
      (await api.GET("/api/v1/sites/{id}", { params: { path: { id: startSiteId! } } })).data!,
    enabled: startSiteId !== null,
  });
  const log = useDiveLog(userId);
  const stats = useDiveStats(userId);
  const [editing, setEditing] = useState<DiveEntry | null>(null);
  // A new key starts the form over. The site from the URL applies only until the first save.
  const [formKey, setFormKey] = useState(0);
  const entries = log.data?.pages.flatMap((page) => page.content) ?? [];
  // An approved site only: a pending one cannot be logged.
  const picked =
    formKey === 0 && startSite.data?.status === "APPROVED"
      ? { id: startSite.data.id, name: startSite.data.name }
      : null;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={`h1 ${styles.flush}`}>{t("divelog.title")}</h1>
        {stats.data && (
          <span className={`body ${styles.muted}`}>
            {t("divelog.stats", {
              dives: stats.data.dives,
              sites: stats.data.sites,
              deepest:
                stats.data.deepest == null
                  ? "—"
                  : `${formatDiveNumber(stats.data.deepest, i18n.language)} ${t("divelog.units.m")}`,
            })}
          </span>
        )}
      </div>
      <div className={styles.columns}>
        <section className={styles.logColumn} aria-label={t("divelog.table.label")}>
          {log.isError && (
            <Alert tone="danger" live>
              {t("divelog.loadError")}
            </Alert>
          )}
          {log.isSuccess && entries.length === 0 && (
            <p className={`body ${styles.flush}`}>{t("divelog.empty")}</p>
          )}
          {entries.length > 0 && (
            <DiveTable
              entries={entries}
              onEdit={(entry) => {
                setEditing(entry);
                setFormKey((key) => key + 1);
              }}
            />
          )}
          {log.hasNextPage && (
            <Button
              variant="secondary"
              disabled={log.isFetchingNextPage}
              onClick={() => void log.fetchNextPage()}
            >
              {t("divelog.loadMore")}
            </Button>
          )}
        </section>
        {(startSiteId === null || !startSite.isPending) && (
          <DiveForm
            key={`${formKey}-${picked?.id ?? ""}`}
            entry={editing}
            site={picked}
            onDone={() => {
              setEditing(null);
              setFormKey((key) => key + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}
