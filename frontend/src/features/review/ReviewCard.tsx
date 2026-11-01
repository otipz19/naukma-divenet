import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Avatar } from "../../components/Avatar/Avatar";
import { Badge } from "../../components/Badge/Badge";
import { Button, buttonClassName } from "../../components/Button/Button";
import { Rating } from "../../components/Rating/Rating";
import { initials } from "../auth/AccountArea";
import type { Review } from "./api";
import styles from "./SiteReviews.module.css";

/** "12 May 2026" in English; the day-month-year order of the language otherwise. */
export function formatReviewDate(iso: string, language: string): string {
  const locale = language === "en" ? "en-GB" : language;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso),
  );
}

/** One review as `design/screens/Site.html` shows it; the own review has Edit and Delete. */
export function ReviewCard({
  review,
  own,
  deleting,
  onDelete,
}: {
  review: Review;
  own: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const name = review.author.displayName;
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <Avatar initials={initials(name, i18n.language)} src={review.author.avatarUrl} />
        <div className={styles.byline}>
          <span className="label">
            <Link to={`/users/${review.author.id}`}>{name}</Link>
            {own && <span className={`body-sm ${styles.count}`}>{t("review.you")}</span>}
          </span>
          <span className={`body-sm ${styles.muted}`}>
            {formatReviewDate(review.createdAt, i18n.language)}
          </span>
          {review.author.verifiedCertificate && (
            <span>
              <Badge tone="success">
                {t("review.verifiedBadge", { certificate: review.author.verifiedCertificate })}
              </Badge>
            </span>
          )}
        </div>
        <span className={styles.spacer} />
        {review.rating != null && <Rating value={review.rating} />}
        {own && !confirming && (
          <span className={styles.actions}>
            <Link
              className={buttonClassName({ variant: "ghost", size: "sm" })}
              to={`/sites/${review.siteId}/review`}
            >
              {t("review.edit")}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className={styles.danger}
              onClick={() => setConfirming(true)}
            >
              {t("review.delete")}
            </Button>
          </span>
        )}
      </div>
      {own && confirming && (
        <div className={styles.confirm} role="group" aria-label={t("review.confirmDelete")}>
          <span className="body-sm">{t("review.confirmDelete")}</span>
          <Button
            variant="danger"
            size="sm"
            disabled={deleting}
            onClick={() => {
              setConfirming(false);
              onDelete();
            }}
          >
            {t("review.confirmYes")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            {t("review.cancel")}
          </Button>
        </div>
      )}
      {review.text && <p className={`body ${styles.text}`}>{review.text}</p>}
      {review.photos.length > 0 && (
        <div className={styles.photos}>
          {review.photos.map((photo, index) => (
            <a key={photo.id} href={photo.url} className={styles.photo}>
              <img
                src={photo.thumbnailUrl}
                alt={t("review.photo", { position: index + 1, name })}
                width={photo.width}
                height={photo.height}
              />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
