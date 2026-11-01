import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import fieldStyles from "../../components/TextField/TextField.module.css";
import { useSession } from "../auth/useSession";
import {
  deleteReview,
  fetchReviews,
  reviewKeys,
  useInvalidateReviews,
  type ReviewSort,
} from "./api";
import { ReviewCard } from "./ReviewCard";
import styles from "./SiteReviews.module.css";

/** The Reviews section of an approved site's page (spec review/site-reviews). */
export function SiteReviews({ siteId }: { siteId: number }) {
  const { t } = useTranslation();
  const session = useSession();
  const viewerId = session.status === "signedIn" ? session.user.id : undefined;
  const [sort, setSort] = useState<ReviewSort>("newest");
  const reviews = useInfiniteQuery({
    queryKey: reviewKeys.list(siteId, sort),
    queryFn: ({ pageParam }) => fetchReviews(siteId, sort, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined,
  });
  const invalidate = useInvalidateReviews();
  const remove = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => invalidate(siteId),
  });

  const all = reviews.data?.pages.flatMap((page) => page.content) ?? [];
  const total = reviews.data?.pages[0]?.page.totalElements;

  return (
    <section className={styles.section} aria-labelledby="reviews-title">
      <div className={styles.head}>
        <h2 id="reviews-title" className={`h2 ${styles.flush}`}>
          {t("review.title")}
          {total !== undefined && <span className={`body-sm ${styles.count}`}>{total}</span>}
        </h2>
        <select
          className={`body ${fieldStyles.input} ${styles.sort}`}
          aria-label={t("review.sort")}
          value={sort}
          onChange={(event) => setSort(event.target.value as ReviewSort)}
        >
          <option value="newest">{t("review.sortNewest")}</option>
          <option value="rating">{t("review.sortRating")}</option>
        </select>
      </div>
      {reviews.isError && (
        <Alert tone="danger" live>
          {t("review.loadError")}
        </Alert>
      )}
      {remove.isError && (
        <Alert tone="danger" live>
          {t("review.deleteFailed")}
        </Alert>
      )}
      {reviews.isSuccess && all.length === 0 && (
        <p className={`body ${styles.flush}`}>{t("review.empty")}</p>
      )}
      {all.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          own={review.author.id === viewerId}
          deleting={remove.isPending && remove.variables === review.id}
          onDelete={() => remove.mutate(review.id)}
        />
      ))}
      {reviews.hasNextPage && (
        <Button
          variant="secondary"
          className={styles.more}
          disabled={reviews.isFetchingNextPage}
          onClick={() => void reviews.fetchNextPage()}
        >
          {t("review.loadMore")}
        </Button>
      )}
    </section>
  );
}
