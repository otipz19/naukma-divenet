import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { ApiError } from "../../api/ApiError";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";
import { Alert } from "../../components/Alert/Alert";
import { DIFFICULTY_WORDS, difficultyWord, levelsOf } from "../../components/Badge/DifficultyBadge";
import { Button, buttonClassName } from "../../components/Button/Button";
import { Chip } from "../../components/Chip/Chip";
import { PhotoField } from "../../components/PhotoField/PhotoField";
import { RatingInput } from "../../components/Rating/Rating";
import { TextAreaField } from "../../components/TextField/TextAreaField";
import { useSession } from "../auth/useSession";
import { createReview, updateReview, useInvalidateReviews, useMyReview, type Review } from "./api";
import { EMPTY_REVIEW, MAX_REVIEW_PHOTOS, reviewSchema, type ReviewValues } from "./reviewSchema";
import styles from "./ReviewFormPage.module.css";

type Site = components["schemas"]["SiteResponse"];

/** `/sites/:id/review` (spec review/review-form): writes a review, or edits the user's own one. */
export function ReviewFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const validId = /^\d+$/.test(id ?? "");
  const siteId = Number(id);
  const session = useSession();
  const viewerId = session.status === "signedIn" ? session.user.id : undefined;
  const site = useQuery({
    queryKey: ["sites", id, viewerId],
    queryFn: async (): Promise<Site> =>
      (await api.GET("/api/v1/sites/{id}", { params: { path: { id: siteId } } })).data!,
    enabled: validId,
  });
  const mine = useMyReview(siteId, validId);

  if (!validId || (site.error instanceof ApiError && site.error.status === 404)) {
    return (
      <div className={styles.page}>
        <h1 className="h1">{t("site.details.notFound")}</h1>
        <Link to="/">{t("site.details.backToMap")}</Link>
      </div>
    );
  }
  if (site.isError || mine.isError) {
    return (
      <div className={styles.page}>
        <Alert tone="danger" live>
          {t("site.details.loadError")}
        </Alert>
      </div>
    );
  }
  if (!site.data || mine.data === undefined) return null;
  return (
    <div className={styles.page}>
      <ReviewForm site={site.data} existing={mine.data} />
    </div>
  );
}

function valuesOf(review: Review | null): ReviewValues {
  if (!review) return EMPTY_REVIEW;
  return {
    rating: review.rating ?? null,
    difficulty: review.difficulty ?? null,
    text: review.text ?? "",
    photos: review.photos,
  };
}

function ReviewForm({ site, existing }: { site: Site; existing: Review | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const invalidate = useInvalidateReviews();
  const [failed, setFailed] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: valuesOf(existing),
  });
  const place = `${t(`geo.countries.${site.countryCode}`)}, ${t(`geo.regions.${site.regionCode}`)}`;
  const sitePath = `/sites/${site.id}`;

  const onSubmit = handleSubmit(async (values) => {
    setFailed(false);
    const body = {
      rating: values.rating ?? undefined,
      difficulty: values.difficulty ?? undefined,
      text: values.text.trim() || undefined,
      photoIds: values.photos.map((photo) => photo.id),
    };
    try {
      if (existing) await updateReview(existing.id, body);
      else await createReview(site.id, body);
      await invalidate(site.id);
      await navigate(sitePath);
    } catch {
      setFailed(true);
    }
  });

  return (
    <>
      <Link className="body-sm" to={sitePath}>
        {`← ${t("review.form.back", { name: site.name })}`}
      </Link>
      <div className={styles.heading}>
        <h1 className={`h1 ${styles.flush}`}>
          {t(existing ? "review.form.titleEdit" : "review.form.titleNew")}
        </h1>
        <p className={`body ${styles.intro}`}>
          {t("review.form.intro", { name: site.name, place })}
        </p>
      </div>
      <form className={styles.card} noValidate onSubmit={(event) => void onSubmit(event)}>
        {failed && (
          <Alert tone="danger" live>
            {t("review.form.errors.failed")}
          </Alert>
        )}
        <Controller
          control={control}
          name="rating"
          render={({ field }) => <RatingInput value={field.value} onChange={field.onChange} />}
        />
        <Controller
          control={control}
          name="difficulty"
          render={({ field }) => {
            const pressed = field.value === null ? undefined : difficultyWord(field.value);
            return (
              <fieldset className={styles.group}>
                <legend className={`label ${styles.legend}`}>{t("review.form.difficulty")}</legend>
                <div className={styles.chips}>
                  {DIFFICULTY_WORDS.map((word) => (
                    <Chip
                      key={word}
                      pressed={pressed === word}
                      // A chip sends the lowest level of its word (design D6).
                      onToggle={() => field.onChange(pressed === word ? null : levelsOf(word)[0]!)}
                    >
                      {t(`site.difficulty.${word}`)}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            );
          }}
        />
        <TextAreaField
          label={t("review.form.text")}
          hint={t("review.form.textHint")}
          rows={8}
          maxLength={4000}
          error={errors.text?.message ? t(errors.text.message) : undefined}
          {...register("text")}
        />
        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <PhotoField value={field.value} onChange={field.onChange} max={MAX_REVIEW_PHOTOS} />
          )}
        />
        <div className={styles.actions}>
          <Link className={buttonClassName({ variant: "secondary" })} to={sitePath}>
            {t("review.form.cancel")}
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t("review.form.saving")
              : t(existing ? "review.form.save" : "review.form.publish")}
          </Button>
        </div>
      </form>
    </>
  );
}
