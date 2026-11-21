import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogCancel,
  DialogForm,
} from "../../components/Dialog/Dialog";
import { PhotoField, type PhotoFieldItem } from "../../components/PhotoField/PhotoField";
import { SelectField } from "../../components/SelectField/SelectField";
import { TextField } from "../../components/TextField/TextField";
import { certificateTitle, type Certificate } from "./certificates";
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

/**
 * The certificate form in a dialog, titled "Add a certificate" or with the certificate's agency
 * and level (spec user/certificates, design D7). A verified one warns before saving.
 */
export function CertificateForm({
  entry,
  onSaved,
  onClose,
}: {
  entry: Certificate | null;
  onSaved: () => Promise<unknown>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
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
      await onSaved();
    } catch {
      setFailed(true);
    }
  });

  const title = entry
    ? t("user.certificates.editTitle", { name: certificateTitle(entry) })
    : t("user.certificates.addTitle");

  return (
    <Dialog title={title} dirty={isDirty} onClose={onClose}>
      <DialogForm noValidate onSubmit={(event) => void onSubmit(event)}>
        <DialogBody>
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
        </DialogBody>
        <DialogActions>
          <DialogCancel>{t("user.certificates.cancel")}</DialogCancel>
          <Button type="submit" disabled={isSubmitting}>
            {t("user.certificates.save")}
          </Button>
        </DialogActions>
      </DialogForm>
    </Dialog>
  );
}
