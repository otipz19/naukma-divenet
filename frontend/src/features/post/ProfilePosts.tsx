import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../components/Alert/Alert";
import { Badge } from "../../components/Badge/Badge";
import { Button, buttonClassName } from "../../components/Button/Button";
import { useBlog, useDrafts } from "./api";
import { PostCard } from "./PostCard";
import styles from "./Post.module.css";

/** The author's blog on a profile, and for the owner their drafts (spec user/profile). */
export function ProfilePosts({ userId, own }: { userId: number; own: boolean }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const blog = useBlog(userId, page);
  const drafts = useDrafts(own);
  const posts = blog.data?.content ?? [];
  const draftItems = drafts.data?.content ?? [];
  const totalPages = blog.data?.page?.totalPages ?? 0;

  if (blog.isError || drafts.isError) {
    return (
      <Alert tone="danger" live>
        {t("post.loadError")}
      </Alert>
    );
  }
  if (!own && posts.length === 0) return null;
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={`h2 ${styles.flush}`}>{t("post.profile.title")}</h2>
        {own && (
          <Link className={buttonClassName({ variant: "secondary", size: "sm" })} to="/posts/new">
            {t("post.profile.write")}
          </Link>
        )}
      </div>
      {draftItems.length > 0 && (
        <div className={styles.drafts}>
          <h3 className={`h3 ${styles.flush}`}>{t("post.profile.drafts")}</h3>
          <div className={styles.draftList}>
            {draftItems.map((draft) => (
              <Link key={draft.id} className={styles.draft} to={`/posts/${draft.id}/edit`}>
                <span className="label">{draft.title}</span>
                <span>
                  <Badge tone="info">{t("post.draft")}</Badge>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {own && blog.isSuccess && posts.length === 0 && (
        <span className={`body ${styles.muted}`}>{t("post.profile.none")}</span>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {totalPages > 1 && (
        <nav className={styles.pager} aria-label={t("post.profile.pagination")}>
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            {t("post.profile.previous")}
          </Button>
          <span className={`body-sm ${styles.muted}`}>
            {t("post.profile.page", { page: page + 1, total: totalPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t("post.profile.next")}
          </Button>
        </nav>
      )}
    </section>
  );
}
