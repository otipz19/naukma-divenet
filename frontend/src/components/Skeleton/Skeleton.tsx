import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Skeleton.module.css";

/**
 * One grey block standing for content that is still loading (design/system/components/Skeleton).
 * `width` and `height` take any CSS length, normally a token (`var(--space-6)`) or a percentage.
 */
export function Skeleton({
  width = "100%",
  height = "var(--space-4)",
  round = false,
  className = "",
}: {
  width?: string;
  height?: string;
  round?: boolean;
  className?: string;
}) {
  const style: CSSProperties = { width, height };
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${round ? styles.round : ""} ${className}`}
      style={style}
    />
  );
}

/**
 * The loading region of a page (spec shared/web-app): `aria-busy`, a visually hidden "Loading…"
 * status for screen readers, and the page's own skeleton blocks as children.
 */
export function PagePlaceholder({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div aria-busy="true" className={`${styles.placeholder} ${className}`}>
      <span role="status" className={styles.status}>
        {t("shell.loading")}
      </span>
      {children}
    </div>
  );
}

/** A few rows of cards: the placeholder shape of a list (feed, queue, results). */
export function CardRows({
  count = 3,
  height = "calc(var(--space-8) * 1.5)",
}: {
  count?: number;
  height?: string;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={height} />
      ))}
    </>
  );
}
