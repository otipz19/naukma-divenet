import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ApiError } from "../../api/ApiError";
import { Alert } from "../../components/Alert/Alert";
import { Badge } from "../../components/Badge/Badge";
import { buttonClassName } from "../../components/Button/Button";
import { useSession } from "../auth/useSession";
import { formatReviewDate } from "../review/ReviewCard";
import { usePost } from "./api";
import styles from "./Post.module.css";

/** The post page at `/posts/:id` (spec post/pages). The text renders as plain text, never markup. */
export function PostPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const post = usePost(Number(id));
  const session = useSession();

  if (post.isError || !Number.isInteger(Number(id))) {
    const missing =
      !Number.isInteger(Number(id)) ||
      (post.error instanceof ApiError && post.error.status === 404);
    return (
      <div className={styles.page}>
        {missing ? (
          <h1 className={`h1 ${styles.flush}`}>{t("post.notFound")}</h1>
        ) : (
          <Alert tone="danger" live>
            {t("post.loadError")}
          </Alert>
        )}
      </div>
    );
  }
  if (!post.data) return null;
  const { data } = post;
  const own = session.status === "signedIn" && session.user.id === data.author.id;

  return (
    <article className={styles.page}>
      <div className={styles.reading}>
        {data.cover && (
          <img className={styles.cover} src={data.cover.url} alt="" fetchPriority="high" />
        )}
        <div className={styles.head}>
          <h1 className={`h1 ${styles.flush}`}>{data.title}</h1>
          {own && (
            <Link
              className={buttonClassName({ variant: "secondary", size: "sm" })}
              to={`/posts/${data.id}/edit`}
            >
              {t("post.edit")}
            </Link>
          )}
        </div>
        <div className={styles.links}>
          {data.status === "DRAFT" && <Badge tone="info">{t("post.draft")}</Badge>}
          {data.regionCode && <Badge>{t(`geo.regions.${data.regionCode}`)}</Badge>}
          {data.site && <Link to={`/sites/${data.site.id}`}>{data.site.name}</Link>}
        </div>
        <span className={`body-sm ${styles.muted}`}>
          <Link to={`/users/${data.author.id}`}>{data.author.displayName}</Link>
          {` · ${formatReviewDate(data.publishedAt ?? data.updatedAt, i18n.language)} · ${t("post.readMinutes", { n: data.readMinutes })}`}
        </span>
        {data.text
          .split(/\n\s*\n/)
          .filter((paragraph) => paragraph.trim())
          .map((paragraph, index) => (
            <p key={index} className={`body ${styles.flush} ${styles.paragraph}`}>
              {paragraph}
            </p>
          ))}
        {data.photos.map((photo) => (
          <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
            <img
              className={styles.image}
              src={photo.url}
              alt={t("post.image", { title: data.title })}
            />
          </a>
        ))}
        {data.videos.map((video, index) => (
          <video
            key={video.id}
            className={styles.image}
            src={video.url}
            controls
            preload="metadata"
            aria-label={t("post.video", { position: index + 1, title: data.title })}
          />
        ))}
      </div>
    </article>
  );
}
