import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { formatReviewDate } from "../review/ReviewCard";
import { useFeed } from "./api";
import styles from "./Post.module.css";

const SHOWN = 3;

/** "Posts about this site" on the site page (spec site/details); no section when there are none. */
export function SitePosts({ siteId }: { siteId: number }) {
  const { t, i18n } = useTranslation();
  const feed = useFeed({ siteId, page: 0, size: SHOWN });
  const posts = feed.data?.content ?? [];
  if (posts.length === 0) return null;
  return (
    <section className={styles.drafts}>
      <h2 className={`h3 ${styles.flush}`}>{t("post.site.title")}</h2>
      {posts.map((post) => (
        <Link key={post.id} className={styles.draft} to={`/posts/${post.id}`}>
          <span className="label">{post.title}</span>
          <span className={`body-sm ${styles.muted}`}>
            {t("post.site.by", {
              name: post.author.displayName,
              date: formatReviewDate(post.publishedAt ?? post.updatedAt, i18n.language),
            })}
          </span>
        </Link>
      ))}
      {(feed.data?.page?.totalElements ?? 0) > SHOWN && (
        <Link className="body-sm" to={`/feed?site=${siteId}`}>
          {t("post.site.seeAll")}
        </Link>
      )}
    </section>
  );
}
