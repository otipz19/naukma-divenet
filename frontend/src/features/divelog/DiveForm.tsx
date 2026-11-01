import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import { SelectField } from "../../components/SelectField/SelectField";
import { TextAreaField } from "../../components/TextField/TextAreaField";
import { TextField } from "../../components/TextField/TextField";
import { useInvalidateDiveLog, type DiveEntry, type DiveEntryRequest } from "./api";
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

/** The log-a-dive form; the parent gives it a new `key` to start over (spec divelog/log-page). */
export function DiveForm({
  entry,
  site,
  onDone,
}: {
  entry: DiveEntry | null;
  site: PickedSite | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const invalidate = useInvalidateDiveLog();
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // On a phone the form is below the table, so Edit would otherwise seem to do nothing.
  useEffect(() => {
    if (entry) formRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [entry]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DiveValues>({
    resolver: zodResolver(diveSchema),
    defaultValues: initialValues(entry, site),
  });
  const message = (key?: string) => (key ? t(key) : undefined);

  const run = async (request: () => Promise<unknown>) => {
    setFailed(false);
    try {
      await request();
      await invalidate();
      onDone();
    } catch {
      setFailed(true);
    }
  };

  const onSubmit = handleSubmit((values) => {
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
    return run(() =>
      entry
        ? api.PUT("/api/v1/dive-log/{id}", { params: { path: { id: entry.id } }, body })
        : api.POST("/api/v1/dive-log", { body }),
    );
  });

  return (
    <form
      ref={formRef}
      className={styles.form}
      noValidate
      aria-labelledby="dive-form-title"
      onSubmit={(event) => void onSubmit(event)}
    >
      <h2 id="dive-form-title" className={`h3 ${styles.flush}`}>
        {t(entry ? "divelog.form.editTitle" : "divelog.form.title")}
      </h2>
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
      {confirming && entry ? (
        <div className={styles.actions} role="group" aria-label={t("divelog.form.confirmDelete")}>
          <span className="body-sm">{t("divelog.form.confirmDelete")}</span>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              void run(() =>
                api.DELETE("/api/v1/dive-log/{id}", { params: { path: { id: entry.id } } }),
              )
            }
          >
            {t("divelog.form.confirmYes")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            {t("divelog.form.confirmNo")}
          </Button>
        </div>
      ) : (
        <div className={styles.actions}>
          {entry && (
            <>
              <Button variant="ghost" onClick={() => setConfirming(true)}>
                {t("divelog.form.delete")}
              </Button>
              <Button variant="secondary" onClick={onDone}>
                {t("divelog.form.cancel")}
              </Button>
            </>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {t("divelog.form.save")}
          </Button>
        </div>
      )}
    </form>
  );
}
