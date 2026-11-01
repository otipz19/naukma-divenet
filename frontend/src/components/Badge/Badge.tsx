import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "accent" | "success" | "caution" | "danger" | "info";

/** design/system/components/Badge. The uppercase is CSS; the text stays in sentence case. */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`caption ${styles.badge} ${styles[tone]}`}>{children}</span>;
}
