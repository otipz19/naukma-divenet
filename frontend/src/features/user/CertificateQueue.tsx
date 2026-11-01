import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ApiError } from "../../api/ApiError";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import { TextField } from "../../components/TextField/TextField";
import styles from "../site/ModerationPage.module.css";
import { certificateTitle } from "./certificates";

type QueueItem = components["schemas"]["CertificateQueueItemResponse"];

export function useCertificateQueue() {
  return useQuery({
    queryKey: ["certificates", "admin-queue"],
    queryFn: async () => (await api.GET("/api/v1/admin/certificates")).data,
  });
}

/** The Certificates tab of the moderation page (spec user/certificate-verification). */
export function CertificateQueue() {
  const { t } = useTranslation();
  const queue = useCertificateQueue();
  const [failure, setFailure] = useState<"conflict" | "generic">();
  const items = queue.data?.content ?? [];
  return (
    <>
      {failure && (
        <Alert tone="danger" live>
          {t(
            failure === "conflict"
              ? "site.moderation.certificates.conflict"
              : "site.moderation.failure",
          )}
        </Alert>
      )}
      {queue.isError && (
        <Alert tone="danger" live>
          {t("site.moderation.loadError")}
        </Alert>
      )}
      {queue.isSuccess && items.length === 0 && (
        <p className={`body ${styles.flush}`}>{t("site.moderation.certificates.empty")}</p>
      )}
      {items.map((item) => (
        <CertificateCard key={item.certificate.id} item={item} onFailure={setFailure} />
      ))}
    </>
  );
}

function CertificateCard({
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
  const { certificate, holderId, holderName } = item;
  const path = { params: { path: { id: certificate.id } } };

  const act = async (request: () => Promise<unknown>) => {
    onFailure(undefined);
    setBusy(true);
    try {
      await request();
    } catch (error) {
      onFailure(error instanceof ApiError && error.status === 409 ? "conflict" : "generic");
    } finally {
      setBusy(false);
      await queryClient.invalidateQueries({ queryKey: ["certificates"] });
    }
  };
  const reject = () => {
    const trimmed = reason.trim();
    setReasonMissing(!trimmed);
    if (!trimmed) return;
    void act(() =>
      api.POST("/api/v1/admin/certificates/{id}/reject", { ...path, body: { reason: trimmed } }),
    );
  };

  return (
    <article className={styles.card}>
      <div className={styles.facts}>
        <h2 className={`h3 ${styles.flush}`}>{certificateTitle(certificate)}</h2>
        <span className={`data ${styles.muted}`}>{certificate.number}</span>
        <span className={`body-sm ${styles.muted}`}>
          {t("site.moderation.certificates.declaredBy")}{" "}
          <Link to={`/users/${holderId}`}>{holderName}</Link>
        </span>
        {certificate.photo && (
          <a href={certificate.photo.url} target="_blank" rel="noreferrer">
            <img
              className={styles.certificatePhoto}
              src={certificate.photo.thumbnailUrl}
              alt={t("site.moderation.certificates.photo", {
                name: certificateTitle(certificate),
              })}
            />
          </a>
        )}
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
          <Button
            size="sm"
            disabled={busy}
            onClick={() => void act(() => api.POST("/api/v1/admin/certificates/{id}/verify", path))}
          >
            {t("site.moderation.certificates.verify")}
          </Button>
        </div>
      </div>
    </article>
  );
}
