import { useId } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Rating.module.css";

const STARS = [1, 2, 3, 4, 5] as const;

function Star({ filled, large = false }: { filled: boolean; large?: boolean }) {
  return (
    <svg
      className={`${large ? styles.starLarge : styles.star} ${filled ? "" : styles.empty}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-filled={filled}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </svg>
  );
}

/**
 * design/system/components/Rating, display (spec shared/rating): rounded stars, the exact value and
 * the count, read as one image.
 */
export function Rating({ value, count }: { value?: number | null; count?: number }) {
  const { t } = useTranslation();
  if (value == null) {
    return <span className={`body-sm ${styles.count}`}>{t("rating.none")}</span>;
  }
  const label =
    count === undefined
      ? t("rating.label", { value })
      : t("rating.labelWithCount", { value, count });
  return (
    <span className={styles.rating} role="img" aria-label={label}>
      <span className={styles.stars}>
        {STARS.map((star) => (
          <Star key={star} filled={star <= Math.round(value)} />
        ))}
      </span>
      <span className="data">{value.toFixed(1)}</span>
      {count !== undefined && <span className={`body-sm ${styles.count}`}>{`(${count})`}</span>}
    </span>
  );
}

/**
 * design/system/components/Rating, input (spec shared/rating): radio buttons for 1 to 5 stars and
 * "No rating", controlled by the form.
 */
export function RatingInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const { t } = useTranslation();
  const name = useId();
  return (
    <fieldset className={styles.input}>
      <legend className={`label ${styles.legend}`}>{t("rating.input")}</legend>
      <div className={styles.options}>
        {STARS.map((star) => (
          <label key={star} className={styles.starOption}>
            <input
              type="radio"
              className={styles.radio}
              name={name}
              checked={value === star}
              onChange={() => onChange(star)}
              aria-label={t("rating.star", { count: star })}
            />
            <Star filled={value !== null && star <= value} large />
          </label>
        ))}
        {value !== null && (
          <span className={`data ${styles.outOf}`}>{t("rating.outOf", { value })}</span>
        )}
        <label className={`label ${styles.noRating}`}>
          <input
            type="radio"
            className={styles.radio}
            name={name}
            checked={value === null}
            onChange={() => onChange(null)}
          />
          {t("rating.noRating")}
        </label>
      </div>
    </fieldset>
  );
}
