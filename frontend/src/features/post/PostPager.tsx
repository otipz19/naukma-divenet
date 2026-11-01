import { useTranslation } from "react-i18next";
import { Button } from "../../components/Button/Button";
import styles from "./Post.module.css";

/** Previous and Next over zero-based pages; nothing when there is only one page. */
export function PostPager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  return (
    <nav className={styles.pager} aria-label={t("post.profile.pagination")}>
      <Button
        variant="secondary"
        size="sm"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
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
        onClick={() => onChange(page + 1)}
      >
        {t("post.profile.next")}
      </Button>
    </nav>
  );
}
