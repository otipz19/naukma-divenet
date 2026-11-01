import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ApiError } from "../../api/ApiError";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";
import { Alert } from "../../components/Alert/Alert";
import { DifficultyBadge } from "../../components/Badge/DifficultyBadge";
import { Button } from "../../components/Button/Button";
import { TextField } from "../../components/TextField/TextField";
import { formatCoordinates } from "./SitePage";
import styles from "./ModerationPage.module.css";

type QueueItem = components["schemas"]["QueueItemResponse"];

/** The moderation page at `/admin/moderation` (spec site/moderation). */
export function ModerationPage() {
  const { t } = useTranslation();
  const queue = useQuery({
    queryKey: ["sites", "admin-queue"],
    queryFn: async () => (await api.GET("/api/v1/admin/sites")).data,
  });
  const [failure, setFailure] = useState<"conflict" | "generic">();
  const items = queue.data?.content ?? [];

  return (
    <div className={styles.page}>
      <h1 className={`h1 ${styles.flush}`}>{t("site.moderation.title")}</h1>
      {failure && (
        <Alert tone="danger" live>
          {t(failure === "conflict" ? "site.moderation.conflict" : "site.moderation.failure")}
        </Alert>
      )}
      {queue.isError && (
        <Alert tone="danger" live>
          {t("site.moderation.loadError")}
        </Alert>
      )}
      {queue.isSuccess && (
        <p className={`label ${styles.flush}`}>
          {t("site.moderation.pending", { n: queue.data?.page.totalElements ?? 0 })}
        </p>
      )}
      {queue.isSuccess && items.length === 0 && (
        <p className={`body ${styles.flush}`}>{t("site.moderation.empty")}</p>
      )}
      {items.map((item) => (
        <QueueCard key={item.site.id} item={item} onFailure={setFailure} />
      ))}
    </div>
  );
}

function QueueCard({
  item,
  onFailure,
}: {
  item: QueueItem;
  onFailure: (failure: "conflict" | "generic" | undefined) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [reasonMissing, setReasonMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const { site, authorName } = item;

  const act = async (request: () => Promise<unknown>) => {
    onFailure(undefined);
    setBusy(true);
    try {
      await request();
    } catch (error) {
      onFailure(error instanceof ApiError && error.status === 409 ? "conflict" : "generic");
    } finally {
      setBusy(false);
      await queryClient.invalidateQueries({ queryKey: ["sites"] });
    }
  };
  const path = { params: { path: { id: site.id } } };
  const approve = () => act(() => api.POST("/api/v1/admin/sites/{id}/approve", path));
  const reject = () => {
    const trimmed = reason.trim();
    setReasonMissing(!trimmed);
    if (!trimmed) return;
    void act(() =>
      api.POST("/api/v1/admin/sites/{id}/reject", { ...path, body: { reason: trimmed } }),
    );
  };

  return (
    <article className={styles.card}>
      <div className={styles.facts}>
        <h2 className={`h3 ${styles.flush}`}>
          <Link to={`/sites/${site.id}`}>{site.name}</Link>
        </h2>
        <span className={`data ${styles.muted}`}>
          {`${formatCoordinates(site.lat, site.lng)} · ${t("site.depthRange", { min: site.minDepth, max: site.maxDepth })}`}
        </span>
        <span className={`body-sm ${styles.place}`}>
          {`${t(`geo.countries.${site.countryCode}`)} · ${t(`geo.regions.${site.regionCode}`)}`}
          <DifficultyBadge difficulty={site.difficulty} />
        </span>
        <p className={`body-sm ${styles.muted} ${styles.flush}`}>{site.description}</p>
        <span className={`body-sm ${styles.muted}`}>
          {t("site.moderation.submittedBy", { name: authorName })}
        </span>
        <a
          className="body-sm"
          href={`https://www.openstreetmap.org/?mlat=${site.lat}&mlon=${site.lng}#map=12/${site.lat}/${site.lng}`}
          target="_blank"
          rel="noreferrer"
        >
          {t("site.moderation.openMap")}
        </a>
      </div>
      <div className={styles.actions}>
        <TextField
          label={t("site.moderation.reason")}
          value={reason}
          maxLength={500}
          error={reasonMissing ? t("site.moderation.reasonRequired") : undefined}
          onChange={(event) => setReason(event.target.value)}
        />
        <div className={styles.buttons}>
          <Button variant="secondary" size="sm" disabled={busy} onClick={reject}>
            {t("site.moderation.reject")}
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void approve()}>
            {t("site.moderation.approve")}
          </Button>
        </div>
      </div>
    </article>
  );
}
