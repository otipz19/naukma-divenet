import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../components/Alert/Alert";
import { buttonClassName } from "../../components/Button/Button";
import { useBlog, useDrafts } from "./api";
import { DraftList } from "./DraftList";
import { PostCard } from "./PostCard";
import { PostPager } from "./PostPager";
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
      <DraftList drafts={draftItems} />
      {own && blog.isSuccess && posts.length === 0 && (
        <span className={`body ${styles.muted}`}>{t("post.profile.none")}</span>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <PostPager page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}
