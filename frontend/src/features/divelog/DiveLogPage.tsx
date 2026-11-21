import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/Dialog/Dialog";
import { useToast } from "../../components/Toast/Toast";
import { useAchievements } from "../achievement/api";
import { useSession } from "../auth/useSession";
import {
  formatDiveDate,
  formatDiveNumber,
  useDiveLog,
  useDiveStats,
  useInvalidateDiveLog,
  type DiveEntry,
} from "./api";
import { DiveForm } from "./DiveForm";
import { DiveTable } from "./DiveTable";
import type { PickedSite } from "./SitePicker";
import styles from "./DiveLog.module.css";

/** The one dialog the page may show (design D6). */
type DialogState =
  | { kind: "new"; site: PickedSite | null }
  | { kind: "edit"; entry: DiveEntry }
  | { kind: "delete"; entry: DiveEntry }
  | null;

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
  const invalidate = useInvalidateDiveLog();
  const toast = useToast();
  const [dialog, setDialog] = useState<DialogState>(null);
  // Each opened form is a new one, so a reopened dialog never keeps old values.
  const [formKey, setFormKey] = useState(0);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const open = (next: DialogState) => {
    setDeleteFailed(false);
    setFormKey((key) => key + 1);
    setDialog(next);
  };

  // `?site=` opens the dialog once, with an approved site chosen: a pending one cannot be logged.
  const startUsed = useRef(false);
  const startData = startSite.data;
  useEffect(() => {
    if (startUsed.current || startData?.status !== "APPROVED") return;
    startUsed.current = true;
    open({ kind: "new", site: { id: startData.id, name: startData.name } });
  }, [startData]);

  const achievements = useAchievements(userId);
  // What is earned now but was not before the save (add-achievements design D5), one toast each.
  const announceUnlocked = async () => {
    const before = achievements.data;
    const { data: after } = await achievements.refetch();
    if (!before || !after) return;
    const earned = new Set(before.filter((item) => item.earnedAt).map((item) => item.code));
    for (const item of after) {
      if (!item.earnedAt || earned.has(item.code)) continue;
      toast.show({
        title: t("achievement.unlocked", { name: t(`achievement.items.${item.code}.name`) }),
        body: t(`achievement.items.${item.code}.description`),
        link: { to: `/users/${userId}`, label: t("achievement.seeAll") },
      });
    }
  };

  const remove = async (entry: DiveEntry) => {
    setDialog(null);
    try {
      await api.DELETE("/api/v1/dive-log/{id}", { params: { path: { id: entry.id } } });
      await invalidate();
      // Keeps the before-save list current for the next announcement.
      void achievements.refetch();
    } catch {
      setDeleteFailed(true);
    }
  };

  const entries = log.data?.pages.flatMap((page) => page.content) ?? [];
  const named = (entry: DiveEntry) => ({
    site: entry.siteName,
    date: formatDiveDate(entry.date, i18n.language),
  });

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
        <Button className={styles.headAction} onClick={() => open({ kind: "new", site: null })}>
          {t("divelog.form.title")}
        </Button>
      </div>
      <section className={styles.logColumn} aria-label={t("divelog.table.label")}>
        {log.isError && (
          <Alert tone="danger" live>
            {t("divelog.loadError")}
          </Alert>
        )}
        {deleteFailed && (
          <Alert tone="danger" live>
            {t("divelog.deleteFailure")}
          </Alert>
        )}
        {log.isSuccess && entries.length === 0 && (
          <p className={`body ${styles.flush}`}>{t("divelog.empty")}</p>
        )}
        {entries.length > 0 && (
          <DiveTable
            entries={entries}
            onEdit={(entry) => open({ kind: "edit", entry })}
            onDelete={(entry) => open({ kind: "delete", entry })}
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
      {(dialog?.kind === "new" || dialog?.kind === "edit") && (
        <DiveForm
          key={formKey}
          entry={dialog.kind === "edit" ? dialog.entry : null}
          site={dialog.kind === "new" ? dialog.site : null}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            void announceUnlocked();
          }}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          question={t("divelog.confirmDelete", named(dialog.entry))}
          confirmLabel={t("divelog.table.delete")}
          onConfirm={() => void remove(dialog.entry)}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
