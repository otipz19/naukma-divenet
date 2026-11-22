import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import type { NavItem } from "../../app/navigation";
import { Badge } from "../Badge/Badge";
import styles from "./NavLinks.module.css";

/** The main navigation entries; `NavLink` marks the current one with `aria-current="page"`. */
export function NavLinks({
  items,
  vertical = false,
  onNavigate,
}: {
  items: NavItem[];
  vertical?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={`${styles.list} ${vertical ? styles.vertical : ""}`}>
      {items.map((item) => {
        const label = t(item.labelKey);
        const badge = item.badge !== undefined && item.badge > 0 ? item.badge : undefined;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={`label ${styles.link}`}
            aria-label={
              badge === undefined ? undefined : t("shell.nav.pending", { label, count: badge })
            }
            onClick={onNavigate}
          >
            {label}
            {badge !== undefined && (
              <span className={styles.badge} aria-hidden="true">
                <Badge tone="caution">{badge}</Badge>
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
