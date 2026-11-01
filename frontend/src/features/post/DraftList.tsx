import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "../../components/Badge/Badge";
import type { PostSummary } from "./api";
import styles from "./Post.module.css";

/** The signed-in user's drafts, each linking to its editor; nothing when there are none. */
export function DraftList({ drafts }: { drafts: PostSummary[] }) {
  const { t } = useTranslation();
  if (drafts.length === 0) return null;
  return (
    <div className={styles.drafts}>
      <h3 className={`h3 ${styles.flush}`}>{t("post.profile.drafts")}</h3>
      <div className={styles.draftList}>
        {drafts.map((draft) => (
          <Link key={draft.id} className={styles.draft} to={`/posts/${draft.id}/edit`}>
            <span className="label">{draft.title}</span>
            <span>
              <Badge tone="info">{t("post.draft")}</Badge>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
