import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { navItems } from "../../app/navigation";
import styles from "./NavLinks.module.css";

/** The main navigation entries; `NavLink` marks the current one with `aria-current="page"`. */
export function NavLinks({
  vertical = false,
  onNavigate,
}: {
  vertical?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={`${styles.list} ${vertical ? styles.vertical : ""}`}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={`label ${styles.link}`}
          onClick={onNavigate}
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
    </div>
  );
}
