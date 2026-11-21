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
import { SelectField } from "../../components/SelectField/SelectField";
import { TextAreaField } from "../../components/TextField/TextAreaField";
import { TextField } from "../../components/TextField/TextField";
import { formatDiveDate, useInvalidateDiveLog, type DiveEntry, type DiveEntryRequest } from "./api";
import { SitePicker, type PickedSite } from "./SitePicker";
import styles from "./DiveLog.module.css";

const CURRENTS = ["NONE", "MILD", "MODERATE", "STRONG"] as const;

// Each message is an i18n key, translated where it is shown. Numbers stay strings while edited.
const optionalNumber = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") return true;
      const parsed = Number(value);
      return (
        Number.isFinite(parsed) && parsed >= min && parsed <= max && /^-?\d+(\.\d)?$/.test(value)
      );
    }, message);

export const diveSchema = z.object({
  site: z
    .custom<PickedSite | null>()
    .refine((site) => Boolean(site), "divelog.form.errors.siteRequired"),
  date: z.string().min(1, "divelog.form.errors.dateRequired"),
  maxDepth: optionalNumber(0, 400, "divelog.form.errors.maxDepth"),
  visibility: optionalNumber(0, 200, "divelog.form.errors.visibility"),
  waterTemperature: optionalNumber(-5, 40, "divelog.form.errors.waterTemperature"),
  current: z.string(),
  buddies: z.string().max(200, "divelog.form.errors.buddies"),
  notes: z.string().max(2000, "divelog.form.errors.notes"),
});
type DiveValues = z.infer<typeof diveSchema>;

/** The viewer's own calendar day, which the API allows even when UTC is still on yesterday. */
function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function initialValues(entry: DiveEntry | null, site: PickedSite | null): DiveValues {
  return {
    site: entry ? { id: entry.siteId, name: entry.siteName } : site,
    date: entry?.date ?? localToday(),
    maxDepth: entry?.maxDepth?.toString() ?? "",
    visibility: entry?.visibility?.toString() ?? "",
    waterTemperature: entry?.waterTemperature?.toString() ?? "",
    current: entry?.current ?? "",
    buddies: entry?.buddies ?? "",
    notes: entry?.notes ?? "",
  };
}

const numberOrUndefined = (value: string) => (value === "" ? undefined : Number(value));

/**
 * The log-a-dive form in a dialog, titled "Log a dive" or "Edit dive: <site>, <date>" (spec
 * divelog/log-page, design D6). Closing with unsaved changes asks first; saving closes it.
 */
export function DiveForm({
  entry,
  site,
  onSaved,
  onClose,
}: {
  entry: DiveEntry | null;
  site: PickedSite | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const invalidate = useInvalidateDiveLog();
  const [failed, setFailed] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DiveValues>({
    resolver: zodResolver(diveSchema),
    defaultValues: initialValues(entry, site),
  });
  const message = (key?: string) => (key ? t(key) : undefined);

  const onSubmit = handleSubmit(async (values) => {
    const body: DiveEntryRequest = {
      siteId: values.site!.id,
      date: values.date,
      maxDepth: numberOrUndefined(values.maxDepth),
      visibility: numberOrUndefined(values.visibility),
      waterTemperature: numberOrUndefined(values.waterTemperature),
      current: (values.current || undefined) as DiveEntryRequest["current"],
      buddies: values.buddies.trim() || undefined,
      notes: values.notes.trim() || undefined,
    };
    setFailed(false);
    try {
      await (entry
        ? api.PUT("/api/v1/dive-log/{id}", { params: { path: { id: entry.id } }, body })
        : api.POST("/api/v1/dive-log", { body }));
      await invalidate();
      onSaved();
    } catch {
      setFailed(true);
    }
  });

  const title = entry
    ? t("divelog.dialog.editTitle", {
        site: entry.siteName,
        date: formatDiveDate(entry.date, i18n.language),
      })
    : t("divelog.form.title");

  return (
    <Dialog title={title} dirty={isDirty} onClose={onClose}>
      <DialogForm noValidate onSubmit={(event) => void onSubmit(event)}>
        <DialogBody>
          <Controller
            control={control}
            name="site"
            render={({ field }) => (
              <SitePicker
                value={field.value}
                onChange={field.onChange}
                error={message(errors.site?.message)}
              />
            )}
          />
          <TextField
            type="date"
            label={t("divelog.form.date")}
            error={message(errors.date?.message)}
            {...register("date")}
          />
          <div className={styles.pair}>
            <TextField
              label={t("divelog.form.maxDepth")}
              inputMode="decimal"
              error={message(errors.maxDepth?.message)}
              {...register("maxDepth")}
            />
            <TextField
              label={t("divelog.form.visibility")}
              inputMode="decimal"
              error={message(errors.visibility?.message)}
              {...register("visibility")}
            />
            <TextField
              label={t("divelog.form.waterTemperature")}
              inputMode="text"
              error={message(errors.waterTemperature?.message)}
              {...register("waterTemperature")}
            />
            <SelectField label={t("divelog.form.current")} {...register("current")}>
              <option value="">{t("divelog.form.currentUnset")}</option>
              {CURRENTS.map((current) => (
                <option key={current} value={current}>
                  {t(`divelog.currents.${current}`)}
                </option>
              ))}
            </SelectField>
          </div>
          <TextField
            label={t("divelog.form.buddies")}
            error={message(errors.buddies?.message)}
            {...register("buddies")}
          />
          <TextAreaField
            label={t("divelog.form.notes")}
            rows={3}
            error={message(errors.notes?.message)}
            {...register("notes")}
          />
          {failed && (
            <Alert tone="danger" live>
              {t("divelog.form.failure")}
            </Alert>
          )}
        </DialogBody>
        <DialogActions>
          <DialogCancel>{t("divelog.form.cancel")}</DialogCancel>
          <Button type="submit" disabled={isSubmitting}>
            {t("divelog.form.save")}
          </Button>
        </DialogActions>
      </DialogForm>
    </Dialog>
  );
}
