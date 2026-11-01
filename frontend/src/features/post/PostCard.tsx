import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "../../components/Badge/Badge";
import { formatReviewDate } from "../review/ReviewCard";
import type { PostSummary } from "./api";
import styles from "./Post.module.css";

/** A published post in a list, as in design/screens/Feed.html. A profile leaves out its own subject, the author. */
export function PostCard({
  post,
  showAuthor = false,
}: {
  post: PostSummary;
  showAuthor?: boolean;
}) {
  const { t, i18n } = useTranslation();
  return (
    <article className={styles.card}>
      {post.cover && <img className={styles.cover} src={post.cover.thumbnailUrl} alt="" />}
      <div className={styles.cardBody}>
        {(post.regionCode || post.site) && (
          <div className={styles.links}>
            {post.regionCode && <Badge>{t(`geo.regions.${post.regionCode}`)}</Badge>}
            {post.site && <Link to={`/sites/${post.site.id}`}>{post.site.name}</Link>}
          </div>
        )}
        <h3 className={`h2 ${styles.flush}`}>
          <Link className={styles.titleLink} to={`/posts/${post.id}`}>
            {post.title}
          </Link>
        </h3>
        <p className={`body ${styles.flush} ${styles.muted}`}>{post.excerpt}</p>
        <span className={`body-sm ${styles.muted}`}>
          {showAuthor && (
            <>
              <Link to={`/users/${post.author.id}`}>{post.author.displayName}</Link>
              {" · "}
            </>
          )}
          {`${formatReviewDate(post.publishedAt ?? post.updatedAt, i18n.language)} · ${t("post.readMinutes", { n: post.readMinutes })}`}
        </span>
      </div>
    </article>
  );
}
