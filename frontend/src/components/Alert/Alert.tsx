import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./Alert.module.css";

export type AlertTone = "info" | "caution" | "danger" | "success";

const ICONS = { info: Info, caution: TriangleAlert, danger: TriangleAlert, success: CircleCheck };

/**
 * design/system/components/Alert. The icon is decorative; `live` gives a form-level error
 * `role="alert"`, so screen readers announce it.
 */
export function Alert({
  tone,
  title,
  live = false,
  children,
}: {
  tone: AlertTone;
  title?: string;
  live?: boolean;
  children: ReactNode;
}) {
  const Icon = ICONS[tone];
  return (
    <div className={`body-sm ${styles.alert} ${styles[tone]}`} role={live ? "alert" : undefined}>
      <Icon size={20} aria-hidden="true" />
      <span className={styles.body}>
        {title && <strong className={styles.title}>{title}</strong>}
        {children}
      </span>
    </div>
  );
}
