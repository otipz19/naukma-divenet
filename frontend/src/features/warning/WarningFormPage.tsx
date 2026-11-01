import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { ApiError } from "../../api/ApiError";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";
import { Alert } from "../../components/Alert/Alert";
import { Button, buttonClassName } from "../../components/Button/Button";
import { SelectField } from "../../components/SelectField/SelectField";
import { TextAreaField } from "../../components/TextField/TextAreaField";
import { useSession } from "../auth/useSession";
import {
  createWarning,
  fetchWarning,
  updateWarning,
  useInvalidateWarnings,
  warningKeys,
  type Warning,
  type WarningType,
} from "./api";
import styles from "./WarningFormPage.module.css";
import {
  EMPTY_WARNING,
  WARNING_TYPES,
  warningSchema,
  type WarningFormValues,
} from "./warningSchema";

type Site = components["schemas"]["SiteResponse"];

/** `/sites/:id/warnings/new` and `/sites/:id/warnings/:warningId/edit` (spec warning/warning-form). */
export function WarningFormPage() {
  const { t } = useTranslation();
  const { id, warningId } = useParams();
  const validSiteId = /^\d+$/.test(id ?? "");
  const siteId = Number(id);
  const isEdit = warningId !== undefined;
  const validWarningId = !isEdit || /^\d+$/.test(warningId);
  const numWarningId = Number(warningId);
  const session = useSession();
  const viewerId = session.status === "signedIn" ? session.user.id : undefined;

  const site = useQuery({
    queryKey: ["sites", id, viewerId],
    queryFn: async (): Promise<Site> =>
      (await api.GET("/api/v1/sites/{id}", { params: { path: { id: siteId } } })).data!,
    enabled: validSiteId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  const existing = useQuery({
    queryKey: warningKeys.detail(numWarningId),
    queryFn: () => fetchWarning(numWarningId),
    enabled: validSiteId && isEdit && validWarningId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  if (
    !validSiteId ||
    (site.error instanceof ApiError && site.error.status === 404) ||
    (site.data && site.data.status !== "APPROVED")
  ) {
    return (
      <div className={styles.page}>
        <h1 className="h1">{t("site.details.notFound")}</h1>
        <Link to="/">{t("site.details.backToMap")}</Link>
      </div>
    );
  }

  if (site.isError) {
    return (
      <div className={styles.page}>
        <Alert tone="danger" live>
          {t("site.details.loadError")}
        </Alert>
      </div>
    );
  }

  if (!site.data) return null;

  if (
    isEdit &&
    (!validWarningId ||
      (existing.error instanceof ApiError && existing.error.status === 404) ||
      (existing.data && (existing.data.siteId !== siteId || existing.data.author.id !== viewerId)))
  ) {
    return (
      <div className={styles.page}>
        <h1 className="h1">{t("warning.form.notFound")}</h1>
        <Link to={`/sites/${siteId}`}>{t("warning.form.back", { name: site.data.name })}</Link>
      </div>
    );
  }

  if (existing.isError) {
    return (
      <div className={styles.page}>
        <Alert tone="danger" live>
          {t("site.details.loadError")}
        </Alert>
      </div>
    );
  }

  if (isEdit && !existing.data) return null;

  return (
    <div className={styles.page}>
      <WarningForm site={site.data} existing={isEdit ? existing.data! : null} />
    </div>
  );
}

function valuesOf(warning: Warning | null): WarningFormValues {
  if (!warning) return EMPTY_WARNING;
  return {
    type: warning.type,
    text: warning.text,
  };
}

function WarningForm({ site, existing }: { site: Site; existing: Warning | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const invalidate = useInvalidateWarnings();
  const [failed, setFailed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WarningFormValues>({
    resolver: zodResolver(warningSchema),
    defaultValues: valuesOf(existing),
  });

  const place = `${t(`geo.countries.${site.countryCode}`)}, ${t(`geo.regions.${site.regionCode}`)}`;
  const sitePath = `/sites/${site.id}`;

  const onSubmit = handleSubmit(async (values) => {
    setFailed(false);
    const body = {
      type: values.type as WarningType,
      text: values.text.trim(),
    };
    try {
      if (existing) await updateWarning(existing.id, body);
      else await createWarning(site.id, body);
      await invalidate(site.id);
      await navigate(sitePath);
    } catch {
      setFailed(true);
    }
  });

  return (
    <>
      <Link className="body-sm" to={sitePath}>
        {`← ${t("warning.form.back", { name: site.name })}`}
      </Link>
      <div className={styles.heading}>
        <h1 className={`h1 ${styles.flush}`}>
          {t(existing ? "warning.form.titleEdit" : "warning.form.titleNew")}
        </h1>
        <p className={`body ${styles.intro}`}>
          {t("warning.form.intro", { name: site.name, place })}
        </p>
      </div>
      <form className={styles.card} noValidate onSubmit={(event) => void onSubmit(event)}>
        {failed && (
          <Alert tone="danger" live>
            {t("warning.form.errors.failed")}
          </Alert>
        )}
        <SelectField
          label={t("warning.form.type")}
          error={errors.type?.message ? t(errors.type.message) : undefined}
          {...register("type")}
        >
          <option value="">{t("warning.form.typePlaceholder")}</option>
          {WARNING_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`warning.types.${type}`)}
            </option>
          ))}
        </SelectField>
        <TextAreaField
          label={t("warning.form.text")}
          hint={t("warning.form.textHint")}
          rows={5}
          maxLength={1000}
          error={errors.text?.message ? t(errors.text.message) : undefined}
          {...register("text")}
        />
        <div className={styles.actions}>
          <Link className={buttonClassName({ variant: "secondary" })} to={sitePath}>
            {t("warning.form.cancel")}
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t("warning.form.saving")
              : t(existing ? "warning.form.save" : "warning.form.post")}
          </Button>
        </div>
      </form>
    </>
  );
}
