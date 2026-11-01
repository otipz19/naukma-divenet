import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import { PhotoField, type PhotoFieldItem } from "../../components/PhotoField/PhotoField";
import { SelectField } from "../../components/SelectField/SelectField";
import { TextField } from "../../components/TextField/TextField";
import { useSession } from "../auth/useSession";
import {
  certificateTitle,
  CertificateStatusBadge,
  useCertificates,
  type Certificate,
} from "./certificates";
import styles from "./Certificates.module.css";

const AGENCIES = ["PADI", "SSI", "CMAS", "OTHER"] as const;

// Each message is an i18n key, translated where it is shown.
const certificateSchema = z.object({
  agency: z.enum(AGENCIES),
  level: z
    .string()
    .trim()
    .min(1, "user.certificates.errors.levelRequired")
    .max(100, "user.certificates.errors.levelTooLong"),
  number: z
    .string()
    .trim()
    .min(1, "user.certificates.errors.numberRequired")
    .max(50, "user.certificates.errors.numberTooLong"),
  photos: z.array(z.custom<PhotoFieldItem>()).max(1),
});
type CertificateValues = z.infer<typeof certificateSchema>;

/** The certificates page at `/profile/certificates`, inside `RequireAuth` (spec user/certificates). */
export function CertificatesPage() {
  const { t } = useTranslation();
  const session = useSession();
  const userId = session.status === "signedIn" ? session.user.id : 0;
  const certificates = useCertificates(userId);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [confirming, setConfirming] = useState<number>();
  const [deleteFailed, setDeleteFailed] = useState(false);

  // Reviews show the badge too, so every cached list may be out of date.
  const refresh = () => queryClient.invalidateQueries();
  const startOver = () => {
    setEditing(null);
    setFormKey((key) => key + 1);
  };
  const remove = async (id: number) => {
    setDeleteFailed(false);
    setConfirming(undefined);
    try {
      await api.DELETE("/api/v1/certificates/{id}", { params: { path: { id } } });
      if (editing?.id === id) startOver();
      await refresh();
    } catch {
      setDeleteFailed(true);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={`h1 ${styles.flush}`}>{t("user.certificates.pageTitle")}</h1>
      <div className={styles.columns}>
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
              {confirming === certificate.id ? (
                <div
                  className={styles.actions}
                  role="group"
                  aria-label={t("user.certificates.confirmDelete")}
                >
                  <span className="body-sm">{t("user.certificates.confirmDelete")}</span>
                  <Button variant="danger" size="sm" onClick={() => void remove(certificate.id)}>
                    {t("user.certificates.confirmYes")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirming(undefined)}>
                    {t("user.certificates.confirmNo")}
                  </Button>
                </div>
              ) : (
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("user.certificates.editOne", {
                      name: certificateTitle(certificate),
                    })}
                    onClick={() => {
                      setEditing(certificate);
                      setFormKey((key) => key + 1);
                    }}
                  >
                    {t("user.certificates.edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("user.certificates.deleteOne", {
                      name: certificateTitle(certificate),
                    })}
                    onClick={() => setConfirming(certificate.id)}
                  >
                    {t("user.certificates.delete")}
                  </Button>
                </div>
              )}
            </article>
          ))}
        </section>
        <CertificateForm
          key={formKey}
          entry={editing}
          onDone={() => {
            startOver();
            return refresh();
          }}
          onCancel={startOver}
        />
      </div>
    </div>
  );
}

function CertificateForm({
  entry,
  onDone,
  onCancel,
}: {
  entry: Certificate | null;
  onDone: () => Promise<unknown>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // On a phone the form is below the list, so Edit would otherwise seem to do nothing.
  useEffect(() => {
    if (entry) formRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [entry]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CertificateValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      agency: entry?.agency ?? "PADI",
      level: entry?.level ?? "",
      number: entry?.number ?? "",
      photos: entry?.photo ? [entry.photo] : [],
    },
  });
  const message = (key?: string) => (key ? t(key) : undefined);

  const onSubmit = handleSubmit(async ({ agency, level, number, photos }) => {
    setFailed(false);
    const body = { agency, level, number, photoId: photos[0]?.id };
    try {
      if (entry) {
        await api.PUT("/api/v1/certificates/{id}", { params: { path: { id: entry.id } }, body });
      } else {
        await api.POST("/api/v1/certificates", { body });
      }
      await onDone();
    } catch {
      setFailed(true);
    }
  });

  return (
    <form
      ref={formRef}
      className={styles.form}
      noValidate
      aria-labelledby="certificate-form-title"
      onSubmit={(event) => void onSubmit(event)}
    >
      <h2 id="certificate-form-title" className={`h3 ${styles.flush}`}>
        {t(entry ? "user.certificates.editTitle" : "user.certificates.addTitle")}
      </h2>
      {entry?.status === "VERIFIED" && (
        <Alert tone="caution">{t("user.certificates.reverifyWarning")}</Alert>
      )}
      <SelectField label={t("user.certificates.agency")} {...register("agency")}>
        {AGENCIES.map((agency) => (
          <option key={agency} value={agency}>
            {agency === "OTHER" ? t("user.certificates.agencyOther") : agency}
          </option>
        ))}
      </SelectField>
      <TextField
        label={t("user.certificates.level")}
        error={message(errors.level?.message)}
        {...register("level")}
      />
      <TextField
        label={t("user.certificates.number")}
        hint={t("user.certificates.numberHint")}
        error={message(errors.number?.message)}
        {...register("number")}
      />
      <div className={styles.photo}>
        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <PhotoField
              label={t("user.certificates.photo")}
              value={field.value}
              onChange={field.onChange}
              max={1}
            />
          )}
        />
        <span className={`body-sm ${styles.muted}`}>{t("user.certificates.photoHint")}</span>
      </div>
      {failed && (
        <Alert tone="danger" live>
          {t("user.certificates.failure")}
        </Alert>
      )}
      <div className={styles.actions}>
        {entry && (
          <Button variant="secondary" onClick={onCancel}>
            {t("user.certificates.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {t("user.certificates.save")}
        </Button>
      </div>
    </form>
  );
}
