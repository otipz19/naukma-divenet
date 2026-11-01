import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../components/Alert/Alert";
import { Button, buttonClassName } from "../../components/Button/Button";
import { useSession } from "../auth/useSession";
import {
  deleteWarning,
  fetchWarnings,
  hideWarning,
  useInvalidateWarnings,
  warningKeys,
} from "./api";
import styles from "./SiteWarnings.module.css";
import { WarningAlert } from "./WarningAlert";

const COLLAPSED_LIMIT = 2;

/** The "Recent warnings" section of an approved site's page (spec warning/site-warnings). */
export function SiteWarnings({ siteId }: { siteId: number }) {
  const { t } = useTranslation();
  const session = useSession();
  const viewerId = session.status === "signedIn" ? session.user.id : undefined;
  const isAdmin = session.status === "signedIn" && session.user.role === "ADMIN";
  const [expanded, setExpanded] = useState(false);

  const warnings = useInfiniteQuery({
    queryKey: warningKeys.all(siteId),
    queryFn: ({ pageParam }) => fetchWarnings(siteId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined,
  });

  const invalidate = useInvalidateWarnings();
  const remove = useMutation({
    mutationFn: deleteWarning,
    onSuccess: () => invalidate(siteId),
  });
  const hide = useMutation({
    mutationFn: hideWarning,
    onSuccess: () => invalidate(siteId),
  });

  const all = warnings.data?.pages.flatMap((page) => page.content) ?? [];
  const total = warnings.data?.pages[0]?.page.totalElements ?? 0;
  const shown = expanded ? all : all.slice(0, COLLAPSED_LIMIT);

  return (
    <section className={styles.section} aria-labelledby="warnings-title">
      <div className={styles.head}>
        <h2 id="warnings-title" className={`h2 ${styles.flush}`}>
          {t("warning.title")}
        </h2>
        <Link
          className={buttonClassName({ variant: "ghost", size: "sm" })}
          to={`/sites/${siteId}/warnings/new`}
        >
          {t("warning.report")}
        </Link>
      </div>
      {warnings.isError && (
        <Alert tone="danger" live>
          {t("warning.loadError")}
        </Alert>
      )}
      {remove.isError && (
        <Alert tone="danger" live>
          {t("warning.deleteFailed")}
        </Alert>
      )}
      {hide.isError && (
        <Alert tone="danger" live>
          {t("warning.hideFailed")}
        </Alert>
      )}
      {warnings.isSuccess && all.length === 0 && (
        <p className={`body ${styles.flush}`}>{t("warning.empty")}</p>
      )}
      {shown.map((warning) => (
        <WarningAlert
          key={warning.id}
          warning={warning}
          own={warning.author.id === viewerId}
          isAdmin={isAdmin}
          deleting={remove.isPending && remove.variables === warning.id}
          hiding={hide.isPending && hide.variables === warning.id}
          onDelete={() => remove.mutate(warning.id)}
          onHide={() => hide.mutate(warning.id)}
        />
      ))}
      {!expanded && total > COLLAPSED_LIMIT && (
        <Button variant="ghost" size="sm" className={styles.more} onClick={() => setExpanded(true)}>
          {t("warning.showAll", { n: total })}
        </Button>
      )}
      {expanded && warnings.hasNextPage && (
        <Button
          variant="secondary"
          className={styles.more}
          disabled={warnings.isFetchingNextPage}
          onClick={() => void warnings.fetchNextPage()}
        >
          {t("warning.loadMore")}
        </Button>
      )}
    </section>
  );
}
