import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/Dialog/Dialog";
import { useSession } from "../auth/useSession";
import { CertificateForm } from "./CertificateForm";
import {
  certificateTitle,
  CertificateStatusBadge,
  useCertificates,
  type Certificate,
} from "./certificates";
import styles from "./Certificates.module.css";

/** The one dialog the page may show (design D7). */
type DialogState =
  | { kind: "new" }
  | { kind: "edit"; entry: Certificate }
  | { kind: "delete"; entry: Certificate }
  | null;

/** The certificates page at `/profile/certificates`, inside `RequireAuth` (spec user/certificates). */
export function CertificatesPage() {
  const { t } = useTranslation();
  const session = useSession();
  const userId = session.status === "signedIn" ? session.user.id : 0;
  const certificates = useCertificates(userId);
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<DialogState>(null);
  // Each opened form is a new one, so a reopened dialog never keeps old values.
  const [formKey, setFormKey] = useState(0);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const open = (next: DialogState) => {
    setDeleteFailed(false);
    setFormKey((key) => key + 1);
    setDialog(next);
  };

  // Reviews show the badge too, so every cached list may be out of date.
  const refresh = () => queryClient.invalidateQueries();
  const remove = async (id: number) => {
    setDialog(null);
    try {
      await api.DELETE("/api/v1/certificates/{id}", { params: { path: { id } } });
      await refresh();
    } catch {
      setDeleteFailed(true);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={`h1 ${styles.flush}`}>{t("user.certificates.pageTitle")}</h1>
        <Button onClick={() => open({ kind: "new" })}>{t("user.certificates.addTitle")}</Button>
      </div>
      <section className={styles.list} aria-label={t("user.certificates.title")}>
        {certificates.isError && (
          <Alert tone="danger" live>
            {t("user.certificates.loadError")}
          </Alert>
        )}
        {deleteFailed && (
          <Alert tone="danger" live>
            {t("user.certificates.failure")}
          </Alert>
        )}
        {certificates.isSuccess && certificates.data.length === 0 && (
          <span className={`body ${styles.muted}`}>{t("user.certificates.none")}</span>
        )}
        {certificates.data?.map((certificate) => (
          <article key={certificate.id} className={styles.card}>
            <div className={styles.head}>
              <span className="label">{certificateTitle(certificate)}</span>
              <CertificateStatusBadge status={certificate.status} />
            </div>
            <span className={`data ${styles.muted}`}>{certificate.number}</span>
            {certificate.rejectionReason && (
              <span className="body-sm">
                {t("user.certificates.rejectedBecause", { reason: certificate.rejectionReason })}
              </span>
            )}
            <div className={styles.actions}>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("user.certificates.editOne", { name: certificateTitle(certificate) })}
                onClick={() => open({ kind: "edit", entry: certificate })}
              >
                {t("user.certificates.edit")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("user.certificates.deleteOne", {
                  name: certificateTitle(certificate),
                })}
                onClick={() => open({ kind: "delete", entry: certificate })}
              >
                {t("user.certificates.delete")}
              </Button>
            </div>
          </article>
        ))}
      </section>
      {(dialog?.kind === "new" || dialog?.kind === "edit") && (
        <CertificateForm
          key={formKey}
          entry={dialog.kind === "edit" ? dialog.entry : null}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            return refresh();
          }}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          question={t("user.certificates.confirmDelete", {
            name: certificateTitle(dialog.entry),
          })}
          confirmLabel={t("user.certificates.delete")}
          onConfirm={() => void remove(dialog.entry.id)}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
